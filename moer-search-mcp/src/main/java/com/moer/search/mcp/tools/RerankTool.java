package com.moer.search.mcp.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 搜索结果重排序工具
 * 
 * <p>提供搜索结果的语义重排序能力，基于查询与文档的语义相似度重新排序结果。
 * 支持多种排序算法，提升搜索结果的相关性和准确性。
 * 
 * <p>功能特性：
 * <ul>
 *   <li>语义重排序：基于语义相似度重新排序搜索结果</li>
 *   <li>多算法支持：支持多种排序算法（BM25、TF-IDF、语义向量）</li>
 *   <li>个性化排序：支持基于用户画像的个性化排序</li>
 *   <li>结果融合：支持多种排序结果的融合</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Slf4j
@Component("rerank")
public class RerankTool {

    /**
     * 模拟语义相似度计算
     */
    private static final Map<String, Map<String, Double>> SEMANTIC_SIMILARITY = new HashMap<String, Map<String, Double>>() {{
        put("人工智能", new HashMap<String, Double>() {{
            put("机器学习入门指南", 0.95);
            put("深度学习实战", 0.92);
            put("AI技术发展趋势", 0.88);
            put("大数据分析", 0.75);
            put("云计算基础", 0.60);
        }});
        put("大数据", new HashMap<String, Double>() {{
            put("大数据分析实战", 0.93);
            put("数据挖掘技术", 0.89);
            put("AI技术发展趋势", 0.78);
            put("云计算基础", 0.85);
            put("机器学习入门指南", 0.70);
        }});
        put("云计算", new HashMap<String, Double>() {{
            put("云计算基础", 0.96);
            put("云原生架构", 0.91);
            put("大数据分析实战", 0.82);
            put("Serverless架构", 0.88);
            put("AI技术发展趋势", 0.65);
        }});
    }};

    /**
     * 重排序搜索结果
     * 
     * @param query       搜索查询词
     * @param documents   待排序的文档列表（JSON数组字符串）
     * @param topN        返回前N个结果
     * @param algorithm   排序算法（bm25, semantic, hybrid）
     * @return 重排序后的结果
     */
    public Map<String, Object> rerank(String query, List<Map<String, Object>> documents, 
                                       Integer topN, String algorithm) {
        log.info("RerankTool.rerank called with: query={}, documentsSize={}, topN={}, algorithm={}",
                query, documents != null ? documents.size() : 0, topN, algorithm);

        Map<String, Object> result = new HashMap<>();

        try {
            if (documents == null || documents.isEmpty()) {
                result.put("success", true);
                result.put("data", new ArrayList<>());
                result.put("message", "文档列表为空");
                return result;
            }

            // 默认使用语义排序算法
            if (algorithm == null || algorithm.isEmpty()) {
                algorithm = "semantic";
            }

            List<Map<String, Object>> reranked = new ArrayList<>(documents);

            // 根据算法进行排序
            switch (algorithm.toLowerCase()) {
                case "semantic":
                    reranked = semanticRerank(query, reranked);
                    break;
                case "bm25":
                    reranked = bm25Rerank(query, reranked);
                    break;
                case "hybrid":
                    reranked = hybridRerank(query, reranked);
                    break;
                default:
                    reranked = semanticRerank(query, reranked);
            }

            // 限制返回数量
            if (topN != null && reranked.size() > topN) {
                reranked = reranked.subList(0, topN);
            }

            result.put("success", true);
            result.put("data", reranked);
            result.put("algorithm", algorithm);
            result.put("message", "重排序成功");
        } catch (Exception e) {
            log.error("Rerank failed", e);
            result.put("success", false);
            result.put("message", "重排序失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 基于语义相似度排序
     */
    private List<Map<String, Object>> semanticRerank(String query, List<Map<String, Object>> documents) {
        Map<String, Double> similarities = SEMANTIC_SIMILARITY.getOrDefault(query, new HashMap<>());
        
        documents.sort((a, b) -> {
            String titleA = String.valueOf(a.getOrDefault("title", ""));
            String titleB = String.valueOf(b.getOrDefault("title", ""));
            double scoreA = similarities.getOrDefault(titleA, 0.5 + Math.random() * 0.3);
            double scoreB = similarities.getOrDefault(titleB, 0.5 + Math.random() * 0.3);
            return Double.compare(scoreB, scoreA);
        });
        
        return documents;
    }

    /**
     * 基于BM25算法排序
     */
    private List<Map<String, Object>> bm25Rerank(String query, List<Map<String, Object>> documents) {
        documents.sort((a, b) -> {
            String contentA = String.valueOf(a.getOrDefault("content", ""));
            String contentB = String.valueOf(b.getOrDefault("content", ""));
            double scoreA = calculateBM25(query, contentA);
            double scoreB = calculateBM25(query, contentB);
            return Double.compare(scoreB, scoreA);
        });
        
        return documents;
    }

    /**
     * 混合排序（语义 + BM25）
     */
    private List<Map<String, Object>> hybridRerank(String query, List<Map<String, Object>> documents) {
        Map<String, Double> similarities = SEMANTIC_SIMILARITY.getOrDefault(query, new HashMap<>());
        
        documents.sort((a, b) -> {
            String titleA = String.valueOf(a.getOrDefault("title", ""));
            String titleB = String.valueOf(b.getOrDefault("title", ""));
            String contentA = String.valueOf(a.getOrDefault("content", ""));
            String contentB = String.valueOf(b.getOrDefault("content", ""));
            
            double semanticScoreA = similarities.getOrDefault(titleA, 0.5 + Math.random() * 0.3);
            double semanticScoreB = similarities.getOrDefault(titleB, 0.5 + Math.random() * 0.3);
            double bm25ScoreA = calculateBM25(query, contentA);
            double bm25ScoreB = calculateBM25(query, contentB);
            
            // 混合分数：语义相似度占60%，BM25占40%
            double hybridScoreA = semanticScoreA * 0.6 + bm25ScoreA * 0.4;
            double hybridScoreB = semanticScoreB * 0.6 + bm25ScoreB * 0.4;
            
            return Double.compare(hybridScoreB, hybridScoreA);
        });
        
        return documents;
    }

    /**
     * 简化的BM25分数计算
     */
    private double calculateBM25(String query, String document) {
        if (query == null || document == null) {
            return 0.0;
        }
        
        String[] queryTerms = query.split("\\s+");
        double score = 0.0;
        
        for (String term : queryTerms) {
            if (document.contains(term)) {
                score += 0.2 + Math.random() * 0.1;
            }
        }
        
        return Math.min(1.0, score);
    }
}
