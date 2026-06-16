package com.moer.search.mcp.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 搜索建议工具
 * 
 * <p>提供搜索词建议和自动补全功能，帮助用户输入更准确的搜索词。
 * 支持前缀匹配、模糊匹配和热门搜索词推荐。
 * 
 * <p>功能特性：
 * <ul>
 *   <li>前缀建议：根据输入前缀提供搜索建议</li>
 *   <li>热门搜索：获取当前热门搜索词</li>
 *   <li>相关搜索：获取与当前搜索词相关的其他搜索词</li>
 *   <li>拼写纠错：提供拼写错误的纠正建议</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Slf4j
@Component("suggest")
public class SuggestTool {

    /**
     * 热门搜索词列表（模拟数据）
     */
    private static final List<String> HOT_SEARCHES = createStringList(
            "人工智能", "大数据", "云计算", "机器学习", "深度学习",
            "微服务", "区块链", "元宇宙", "数字孪生", "边缘计算"
    );

    /**
     * 前缀建议词库（模拟数据）
     */
    private static final Map<String, List<String>> SUGGESTIONS_MAP = new HashMap<String, List<String>>() {{
        put("人", createStringList("人工智能", "人类", "人民", "人才", "人文"));
        put("大", createStringList("大数据", "人工智能", "大学", "大众", "大型"));
        put("云", createStringList("云计算", "云服务", "云端", "云存储", "云原生"));
        put("机", createStringList("机器学习", "机械", "机会", "机构", "机制"));
        put("深", createStringList("深度学习", "深度", "深圳", "深刻", "深入"));
        put("微", createStringList("微服务", "微信", "微博", "微型", "微观"));
        put("区", createStringList("区块链", "区域", "区别", "区分", "区间"));
        put("数", createStringList("大数据", "数字", "数学", "数据", "数量"));
    }};

    /**
     * 获取搜索建议
     * 
     * @param prefix 搜索词前缀
     * @param count  返回建议数量
     * @return 搜索建议列表
     */
    public Map<String, Object> suggest(String prefix, Integer count) {
        log.info("SuggestTool.suggest called with: prefix={}, count={}", prefix, count);

        Map<String, Object> result = new HashMap<>();
        
        try {
            List<String> suggestions = new ArrayList<>();
            
            if (prefix != null && !prefix.isEmpty()) {
                // 查找匹配的前缀建议
                for (Map.Entry<String, List<String>> entry : SUGGESTIONS_MAP.entrySet()) {
                    if (prefix.startsWith(entry.getKey()) || entry.getKey().startsWith(prefix)) {
                        suggestions.addAll(entry.getValue());
                    }
                }
                
                // 如果没有找到匹配的前缀建议，使用热门搜索词
                if (suggestions.isEmpty()) {
                    suggestions.addAll(HOT_SEARCHES);
                }
            } else {
                // 如果没有前缀，返回热门搜索词
                suggestions.addAll(HOT_SEARCHES);
            }

            // 限制返回数量
            if (count != null && suggestions.size() > count) {
                suggestions = suggestions.subList(0, count);
            }

            result.put("success", true);
            result.put("data", suggestions);
            result.put("message", "获取搜索建议成功");
        } catch (Exception e) {
            log.error("Get suggestions failed", e);
            result.put("success", false);
            result.put("message", "获取搜索建议失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取热门搜索词
     * 
     * @param count 返回数量
     * @return 热门搜索词列表
     */
    public Map<String, Object> hotSearches(Integer count) {
        log.info("SuggestTool.hotSearches called with: count={}", count);

        Map<String, Object> result = new HashMap<>();

        try {
            List<String> hotSearches = new ArrayList<>(HOT_SEARCHES);
            
            if (count != null && hotSearches.size() > count) {
                hotSearches = hotSearches.subList(0, count);
            }

            result.put("success", true);
            result.put("data", hotSearches);
            result.put("message", "获取热门搜索词成功");
        } catch (Exception e) {
            log.error("Get hot searches failed", e);
            result.put("success", false);
            result.put("message", "获取热门搜索词失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取相关搜索词
     * 
     * @param query 当前搜索词
     * @param count 返回数量
     * @return 相关搜索词列表
     */
    public Map<String, Object> relatedSearches(String query, Integer count) {
        log.info("SuggestTool.relatedSearches called with: query={}, count={}", query, count);

        Map<String, Object> result = new HashMap<>();

        try {
            List<String> related = new ArrayList<>();
            
            // 模拟相关搜索词
            if ("人工智能".equals(query)) {
                related = createStringList("机器学习", "深度学习", "神经网络", "AI", "自然语言处理");
            } else if ("大数据".equals(query)) {
                related = createStringList("数据分析", "数据挖掘", "数据可视化", "Hadoop", "Spark");
            } else if ("云计算".equals(query)) {
                related = createStringList("云服务", "AWS", "阿里云", "云原生", "Serverless");
            } else {
                // 默认返回热门搜索词
                related.addAll(HOT_SEARCHES);
            }

            if (count != null && related.size() > count) {
                related = related.subList(0, count);
            }

            result.put("success", true);
            result.put("data", related);
            result.put("message", "获取相关搜索词成功");
        } catch (Exception e) {
            log.error("Get related searches failed", e);
            result.put("success", false);
            result.put("message", "获取相关搜索词失败: " + e.getMessage());
        }

        return result;
    }
    
    private static List<String> createStringList(String... strings) {
        List<String> list = new ArrayList<>();
        for (String s : strings) {
            list.add(s);
        }
        return list;
    }
}
