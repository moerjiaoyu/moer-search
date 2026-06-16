package com.moer.search.mcp.handlers;

import com.moer.search.mcp.tools.RerankTool;
import com.moer.search.mcp.tools.SearchTool;
import com.moer.search.mcp.tools.SuggestTool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 搜索处理器
 * 
 * <p>统一处理搜索相关的 MCP 请求，协调多个搜索工具的调用。
 * 提供统一的入口点，支持复杂的搜索工作流编排。
 * 
 * <p>支持的功能：
 * <ul>
 *   <li>一站式搜索：执行搜索并返回结果</li>
 *   <li>搜索建议：获取搜索词建议</li>
 *   <li>搜索并重排序：执行搜索后进行语义重排序</li>
 *   <li>组合搜索：支持多步骤搜索流程</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Slf4j
@Component
public class SearchHandler {

    private final SearchTool searchTool;
    private final SuggestTool suggestTool;
    private final RerankTool rerankTool;

    public SearchHandler() {
        this.searchTool = new SearchTool();
        this.suggestTool = new SuggestTool();
        this.rerankTool = new RerankTool();
    }

    /**
     * 执行完整的搜索流程
     * 
     * @param indexName 索引名称
     * @param query     搜索关键词
     * @param options   搜索选项（包含分页、排序、高亮等参数）
     * @return 搜索结果
     */
    public Map<String, Object> executeSearch(String indexName, String query, Map<String, Object> options) {
        log.info("SearchHandler.executeSearch called with: indexName={}, query={}, options={}",
                indexName, query, options);

        Map<String, Object> result = new HashMap<>();

        try {
            // 提取选项参数
            Integer pageNum = options != null ? (Integer) options.getOrDefault("pageNum", 1) : 1;
            Integer pageSize = options != null ? (Integer) options.getOrDefault("pageSize", 10) : 10;
            String fields = options != null ? (String) options.get("fields") : null;
            Boolean enableRerank = options != null ? (Boolean) options.getOrDefault("enableRerank", false) : false;
            String rerankAlgorithm = options != null ? (String) options.getOrDefault("rerankAlgorithm", "semantic") : "semantic";

            // 执行搜索
            Map<String, Object> searchResult = searchTool.search(indexName, query, fields, pageNum, pageSize);
            
            if (!(Boolean) searchResult.get("success")) {
                return searchResult;
            }

            // 如果启用重排序
            if (enableRerank) {
                List<Map<String, Object>> documents = (List<Map<String, Object>>) searchResult.get("data");
                Map<String, Object> rerankResult = rerankTool.rerank(query, documents, pageSize, rerankAlgorithm);
                
                if ((Boolean) rerankResult.get("success")) {
                    searchResult.put("data", rerankResult.get("data"));
                    searchResult.put("rerankAlgorithm", rerankAlgorithm);
                }
            }

            result.put("success", true);
            result.put("data", searchResult.get("data"));
            result.put("total", searchResult.get("total"));
            result.put("message", "搜索完成");
            
            if (enableRerank) {
                result.put("rerankApplied", true);
            }

        } catch (Exception e) {
            log.error("Search execution failed", e);
            result.put("success", false);
            result.put("message", "搜索执行失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 智能搜索建议
     * 
     * @param query 当前输入
     * @param count 返回建议数量
     * @return 搜索建议列表
     */
    public Map<String, Object> getSmartSuggestions(String query, Integer count) {
        log.info("SearchHandler.getSmartSuggestions called with: query={}, count={}", query, count);

        Map<String, Object> result = new HashMap<>();

        try {
            // 如果有查询词，获取相关搜索
            if (query != null && !query.isEmpty()) {
                Map<String, Object> related = suggestTool.relatedSearches(query, count);
                result.put("related", related.get("data"));
            }

            // 获取热门搜索
            Map<String, Object> hot = suggestTool.hotSearches(count);
            result.put("hot", hot.get("data"));

            // 获取前缀建议
            Map<String, Object> suggestions = suggestTool.suggest(query, count);
            result.put("suggestions", suggestions.get("data"));

            result.put("success", true);
            result.put("message", "获取智能建议成功");

        } catch (Exception e) {
            log.error("Get smart suggestions failed", e);
            result.put("success", false);
            result.put("message", "获取智能建议失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 高级搜索（支持多个索引）
     * 
     * @param indexNames 索引名称列表
     * @param query      搜索关键词
     * @param options    搜索选项
     * @return 合并的搜索结果
     */
    public Map<String, Object> multiIndexSearch(List<String> indexNames, String query, Map<String, Object> options) {
        log.info("SearchHandler.multiIndexSearch called with: indexNames={}, query={}", indexNames, query);

        Map<String, Object> result = new HashMap<>();

        try {
            if (indexNames == null || indexNames.isEmpty()) {
                result.put("success", false);
                result.put("message", "索引列表不能为空");
                return result;
            }

            Map<String, Object> mergedResult = new HashMap<>();
            int totalCount = 0;

            for (String indexName : indexNames) {
                Map<String, Object> searchResult = searchTool.search(indexName, query, null, 1, 10);
                
                if ((Boolean) searchResult.get("success")) {
                    mergedResult.put(indexName, searchResult.get("data"));
                    totalCount += (Integer) searchResult.getOrDefault("total", 0);
                }
            }

            result.put("success", true);
            result.put("data", mergedResult);
            result.put("total", totalCount);
            result.put("indices", indexNames);
            result.put("message", "多索引搜索完成");

        } catch (Exception e) {
            log.error("Multi-index search failed", e);
            result.put("success", false);
            result.put("message", "多索引搜索失败: " + e.getMessage());
        }

        return result;
    }
}
