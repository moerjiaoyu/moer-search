package com.moer.search.ontology.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 本体索引配置属性类
 * 
 * 用于配置Elasticsearch索引相关的参数，支持通过application.yml进行外部配置。
 * 
 * <p>配置示例：
 * <pre>
 * ontology:
 *   index:
 *     concept-index-prefix: moer_ontology
 *     document-index-prefix: moer_documents
 *     lifecycle-enabled: true
 *     lifecycle-policy-name: ontology_policy
 *     hot-phase-days: 30
 *     warm-phase-days: 90
 *     cold-phase-days: 180
 *     delete-phase-days: 365
 *     shards: 3
 *     replicas: 1
 *     default-analyzer: ik_smart
 *     search-analyzer: ik_max_word
 * </pre>
 * 
 * @author moer
 * @version 1.0.0
 */
@Data
@Component
@ConfigurationProperties(prefix = "ontology.index")
public class OntologyIndexProperties {

    /** 概念索引名称前缀，完整索引名为 {prefix}_{yyyyMM} */
    private String conceptIndexPrefix = "moer_ontology";

    /** 文档索引名称前缀，完整索引名为 {prefix}_{yyyyMM} */
    private String documentIndexPrefix = "moer_documents";

    /** 是否启用索引生命周期管理 */
    private boolean lifecycleEnabled = true;

    /** 生命周期策略名称 */
    private String lifecyclePolicyName = "ontology_policy";

    /** Hot阶段保留天数 */
    private int hotPhaseDays = 30;

    /** Warm阶段保留天数 */
    private int warmPhaseDays = 90;

    /** Cold阶段保留天数 */
    private int coldPhaseDays = 180;

    /** Delete阶段保留天数（自动删除） */
    private int deletePhaseDays = 365;

    /** 索引分片数 */
    private int shards = 3;

    /** 索引副本数 */
    private int replicas = 1;

    /** 默认分词器 */
    private String defaultAnalyzer = "ik_smart";

    /** 搜索时分词器 */
    private String searchAnalyzer = "ik_max_word";
}