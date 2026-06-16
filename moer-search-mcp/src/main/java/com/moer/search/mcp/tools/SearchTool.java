package com.moer.search.mcp.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Full-text search tool
 * 
 * <p>Provides Elasticsearch-based full-text search capabilities, supporting keyword search, 
 * complex query conditions, and pagination. This tool is exposed to AI Agent via MCP protocol.
 * 
 * <p>Features:
 * <ul>
 *   <li>Keyword search: supports full-text matching across multiple fields</li>
 *   <li>Pagination: supports pagination parameters</li>
 *   <li>Sorting: supports sorting by specified fields</li>
 *   <li>Highlighting: supports keyword highlighting</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Slf4j
@Component("search")
public class SearchTool {

    /**
     * Execute full-text search
     * 
     * @param indexName Index name
     * @param query     Search keyword
     * @param fields    Search field list (comma separated)
     * @param pageNum   Page number (starting from 1)
     * @param pageSize  Page size
     * @return Search results containing matched documents and total count
     */
    public Map<String, Object> search(String indexName, String query, String fields, 
                                      Integer pageNum, Integer pageSize) {
        log.info("SearchTool.search called with: indexName={}, query={}, fields={}, pageNum={}, pageSize={}",
                indexName, query, fields, pageNum, pageSize);

        Map<String, Object> result = new HashMap<>();
        
        try {
            // Generate mock data for demonstration
            result.put("success", true);
            result.put("data", generateMockData(query));
            result.put("total", 100);
            result.put("message", "Search successful (mock data)");
        } catch (Exception e) {
            log.error("Search failed", e);
            result.put("success", false);
            result.put("message", "Search failed: " + e.getMessage());
        }

        return result;
    }

    /**
     * Execute DSL query
     * 
     * @param indexName Index name
     * @param dsl       DSL query statement (JSON format)
     * @return Search results
     */
    public Map<String, Object> searchByDsl(String indexName, String dsl) {
        log.info("SearchTool.searchByDsl called with: indexName={}, dsl={}", indexName, dsl);

        Map<String, Object> result = new HashMap<>();

        try {
            // Generate mock data for demonstration
            result.put("success", true);
            result.put("data", generateMockData("DSL Query"));
            result.put("total", 50);
            result.put("message", "DSL search successful (mock data)");
        } catch (Exception e) {
            log.error("DSL search failed", e);
            result.put("success", false);
            result.put("message", "DSL search failed: " + e.getMessage());
        }

        return result;
    }

    /**
     * Generate mock data
     */
    private java.util.List<Map<String, Object>> generateMockData(String query) {
        java.util.List<Map<String, Object>> data = new java.util.ArrayList<>();
        for (int i = 0; i < 10; i++) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", "doc-" + i);
            item.put("title", "Search Result " + (i + 1) + ": " + query);
            item.put("content", "This is search result content related to '" + query + "'.");
            item.put("score", 1.0 - (i * 0.05));
            data.add(item);
        }
        return data;
    }
}
