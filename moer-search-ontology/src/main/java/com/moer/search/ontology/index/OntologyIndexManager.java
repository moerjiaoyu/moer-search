package com.moer.search.ontology.index;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.moer.search.ontology.config.OntologyIndexProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 本体索引管理器
 * 
 * 负责管理Elasticsearch索引的创建、生命周期策略和模板管理。
 * 启动时自动检查并创建必要的索引、模板和生命周期策略。
 * 
 * <p>核心功能：
 * <ul>
 *   <li>索引模板管理 - 从配置文件加载并创建索引模板</li>
 *   <li>生命周期管理 - 创建和维护索引生命周期策略</li>
 *   <li>按月建索引 - 自动创建当月索引（格式：{prefix}_{yyyyMM}）</li>
 *   <li>索引存在性检查 - 启动时自动检查并创建缺失的索引</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OntologyIndexManager {

    private final OntologyIndexProperties properties;
    private final ElasticsearchClientWrapper esClient;

    /** 月份格式化器，用于生成索引名后缀 */
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyyMM");

    /** 本体概念索引模板路径 */
    private static final String ONTOLOGY_TEMPLATE_PATH = "config/index/moer_ontology_template.json";
    
    /** 文档索引模板路径 */
    private static final String DOCUMENTS_TEMPLATE_PATH = "config/index/moer_documents_template.json";
    
    /** 生命周期策略配置路径 */
    private static final String LIFECYCLE_POLICY_PATH = "config/index/ontology_lifecycle_policy.json";

    /**
     * 初始化方法
     * 
     * 在Spring容器启动时执行，完成以下初始化工作：
     * <ol>
     *   <li>如果启用生命周期管理，创建生命周期策略</li>
     *   <li>创建/更新本体概念索引模板</li>
     *   <li>创建/更新文档索引模板</li>
     *   <li>确保当前月份的概念索引存在</li>
     *   <li>确保当前月份的文档索引存在</li>
     * </ol>
     */
    @PostConstruct
    public void initialize() {
        log.info("Initializing Ontology Index Manager...");
        
        if (properties.isLifecycleEnabled()) {
            createLifecyclePolicyFromConfig();
        }
        
        createOntologyIndexTemplate();
        createDocumentsIndexTemplate();
        
        ensureConceptIndexExists();
        ensureDocumentIndexExists();
        
        log.info("Ontology Index Manager initialized successfully");
    }

    /**
     * 从配置文件创建生命周期策略
     * 
     * 从 classpath 读取 ontology_lifecycle_policy.json 配置文件，
     * 如果策略不存在则创建，已存在则更新。
     */
    private void createLifecyclePolicyFromConfig() {
        String policyName = properties.getLifecyclePolicyName();
        
        try {
            ClassPathResource resource = new ClassPathResource(LIFECYCLE_POLICY_PATH);
            if (!resource.exists()) {
                log.warn("Lifecycle policy config file not found: {}", LIFECYCLE_POLICY_PATH);
                return;
            }
            
            String policyJson = readResourceFile(resource);
            
            boolean success = esClient.createLifecyclePolicy(policyName, policyJson);
            if (success) {
                log.info("Lifecycle policy '{}' created/updated successfully", policyName);
            } else {
                log.warn("Failed to create/update lifecycle policy '{}'", policyName);
            }
        } catch (Exception e) {
            log.error("Failed to load lifecycle policy config: {}", e.getMessage(), e);
        }
    }

    /**
     * 创建本体概念索引模板
     * 
     * 从配置文件读取模板定义并在Elasticsearch中创建/更新模板。
     */
    private void createOntologyIndexTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource(ONTOLOGY_TEMPLATE_PATH);
            if (!resource.exists()) {
                log.warn("Ontology index template config not found: {}", ONTOLOGY_TEMPLATE_PATH);
                return;
            }
            
            String templateJson = readResourceFile(resource);
            boolean success = esClient.createIndexTemplate("moer_ontology_template", templateJson);
            
            if (success) {
                log.info("Ontology index template created/updated successfully");
            } else {
                log.warn("Failed to create/update ontology index template");
            }
        } catch (Exception e) {
            log.error("Failed to load ontology index template config: {}", e.getMessage(), e);
        }
    }

    /**
     * 创建文档索引模板
     * 
     * 从配置文件读取模板定义并在Elasticsearch中创建/更新模板。
     */
    private void createDocumentsIndexTemplate() {
        try {
            ClassPathResource resource = new ClassPathResource(DOCUMENTS_TEMPLATE_PATH);
            if (!resource.exists()) {
                log.warn("Documents index template config not found: {}", DOCUMENTS_TEMPLATE_PATH);
                return;
            }
            
            String templateJson = readResourceFile(resource);
            boolean success = esClient.createIndexTemplate("moer_documents_template", templateJson);
            
            if (success) {
                log.info("Documents index template created/updated successfully");
            } else {
                log.warn("Failed to create/update documents index template");
            }
        } catch (Exception e) {
            log.error("Failed to load documents index template config: {}", e.getMessage(), e);
        }
    }

    /**
     * 确保概念索引存在
     * 
     * 检查当前月份的概念索引是否存在，不存在则创建。
     */
    private void ensureConceptIndexExists() {
        String currentIndex = getCurrentConceptIndex();
        
        if (esClient.indexExists(currentIndex)) {
            log.info("Concept index '{}' already exists", currentIndex);
            return;
        }

        createConceptIndex(currentIndex);
    }

    /**
     * 创建概念索引
     * 
     * 根据配置创建指定名称的概念索引，包含必要的settings和mappings。
     * 
     * @param indexName 索引名称
     */
    private void createConceptIndex(String indexName) {
        Map<String, Object> settings = new HashMap<>();
        settings.put("number_of_shards", properties.getShards());
        settings.put("number_of_replicas", properties.getReplicas());
        
        if (properties.isLifecycleEnabled()) {
            settings.put("index.lifecycle.name", properties.getLifecyclePolicyName());
            settings.put("index.lifecycle.rollover_alias", properties.getConceptIndexPrefix());
        }

        Map<String, Object> mappings = buildConceptMappings();

        boolean success = esClient.createIndex(indexName, settings, mappings);
        if (success) {
            log.info("Concept index '{}' created successfully", indexName);
        } else {
            log.error("Failed to create concept index '{}'", indexName);
        }
    }

    /**
     * 构建概念索引的映射配置
     * 
     * @return 映射配置Map
     */
    private Map<String, Object> buildConceptMappings() {
        Map<String, Object> mappings = new HashMap<>();
        Map<String, Object> propertiesMap = new HashMap<>();

        Map<String, Object> conceptId = new HashMap<>();
        conceptId.put("type", "keyword");
        propertiesMap.put("concept_id", conceptId);

        Map<String, Object> conceptName = new HashMap<>();
        conceptName.put("type", "text");
        conceptName.put("analyzer", properties.getDefaultAnalyzer());
        conceptName.put("search_analyzer", properties.getSearchAnalyzer());
        propertiesMap.put("concept_name", conceptName);

        Map<String, Object> conceptNameEn = new HashMap<>();
        conceptNameEn.put("type", "text");
        conceptNameEn.put("analyzer", "standard");
        propertiesMap.put("concept_name_en", conceptNameEn);

        Map<String, Object> description = new HashMap<>();
        description.put("type", "text");
        description.put("analyzer", properties.getDefaultAnalyzer());
        propertiesMap.put("description", description);

        Map<String, Object> parents = new HashMap<>();
        parents.put("type", "keyword");
        propertiesMap.put("parents", parents);

        Map<String, Object> children = new HashMap<>();
        children.put("type", "keyword");
        propertiesMap.put("children", children);

        Map<String, Object> relations = new HashMap<>();
        relations.put("type", "nested");
        Map<String, Object> relationsProperties = new HashMap<>();
        
        Map<String, Object> relationType = new HashMap<>();
        relationType.put("type", "keyword");
        relationsProperties.put("type", relationType);

        Map<String, Object> targetId = new HashMap<>();
        targetId.put("type", "keyword");
        relationsProperties.put("target_id", targetId);

        relations.put("properties", relationsProperties);
        propertiesMap.put("relations", relations);

        Map<String, Object> semanticType = new HashMap<>();
        semanticType.put("type", "keyword");
        propertiesMap.put("semantic_type", semanticType);

        Map<String, Object> domain = new HashMap<>();
        domain.put("type", "keyword");
        propertiesMap.put("domain", domain);

        Map<String, Object> isAbstract = new HashMap<>();
        isAbstract.put("type", "boolean");
        propertiesMap.put("is_abstract", isAbstract);

        Map<String, Object> synonyms = new HashMap<>();
        synonyms.put("type", "keyword");
        propertiesMap.put("synonyms", synonyms);

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("type", "keyword");
        propertiesMap.put("attributes", attributes);

        Map<String, Object> createTime = new HashMap<>();
        createTime.put("type", "date");
        createTime.put("format", "epoch_millis");
        propertiesMap.put("create_time", createTime);

        Map<String, Object> updateTime = new HashMap<>();
        updateTime.put("type", "date");
        updateTime.put("format", "epoch_millis");
        propertiesMap.put("update_time", updateTime);

        mappings.put("properties", propertiesMap);
        return mappings;
    }

    /**
     * 确保文档索引存在
     * 
     * 检查当前月份的文档索引是否存在，不存在则创建。
     */
    private void ensureDocumentIndexExists() {
        String currentIndex = getCurrentDocumentIndex();
        
        if (esClient.indexExists(currentIndex)) {
            log.info("Document index '{}' already exists", currentIndex);
            return;
        }

        createDocumentIndex(currentIndex);
    }

    /**
     * 创建文档索引
     * 
     * 根据配置创建指定名称的文档索引，包含必要的settings和mappings。
     * 
     * @param indexName 索引名称
     */
    private void createDocumentIndex(String indexName) {
        Map<String, Object> settings = new HashMap<>();
        settings.put("number_of_shards", properties.getShards());
        settings.put("number_of_replicas", properties.getReplicas());
        
        if (properties.isLifecycleEnabled()) {
            settings.put("index.lifecycle.name", properties.getLifecyclePolicyName());
            settings.put("index.lifecycle.rollover_alias", properties.getDocumentIndexPrefix());
        }

        Map<String, Object> mappings = buildDocumentMappings();

        boolean success = esClient.createIndex(indexName, settings, mappings);
        if (success) {
            log.info("Document index '{}' created successfully", indexName);
        } else {
            log.error("Failed to create document index '{}'", indexName);
        }
    }

    /**
     * 构建文档索引的映射配置
     * 
     * @return 映射配置Map
     */
    private Map<String, Object> buildDocumentMappings() {
        Map<String, Object> mappings = new HashMap<>();
        Map<String, Object> propertiesMap = new HashMap<>();

        Map<String, Object> title = new HashMap<>();
        title.put("type", "text");
        title.put("analyzer", properties.getDefaultAnalyzer());
        title.put("search_analyzer", properties.getSearchAnalyzer());
        propertiesMap.put("title", title);

        Map<String, Object> content = new HashMap<>();
        content.put("type", "text");
        content.put("analyzer", properties.getDefaultAnalyzer());
        content.put("search_analyzer", properties.getSearchAnalyzer());
        propertiesMap.put("content", content);

        Map<String, Object> conceptTags = new HashMap<>();
        conceptTags.put("type", "keyword");
        propertiesMap.put("concept_tags", conceptTags);

        Map<String, Object> semanticTypes = new HashMap<>();
        semanticTypes.put("type", "keyword");
        propertiesMap.put("semantic_types", semanticTypes);

        Map<String, Object> instanceId = new HashMap<>();
        instanceId.put("type", "keyword");
        propertiesMap.put("instance_id", instanceId);

        Map<String, Object> conceptId = new HashMap<>();
        conceptId.put("type", "keyword");
        propertiesMap.put("concept_id", conceptId);

        Map<String, Object> conceptName = new HashMap<>();
        conceptName.put("type", "text");
        conceptName.put("analyzer", properties.getDefaultAnalyzer());
        propertiesMap.put("concept_name", conceptName);

        Map<String, Object> createTime = new HashMap<>();
        createTime.put("type", "date");
        createTime.put("format", "epoch_millis");
        propertiesMap.put("create_time", createTime);

        Map<String, Object> updateTime = new HashMap<>();
        updateTime.put("type", "date");
        updateTime.put("format", "epoch_millis");
        propertiesMap.put("update_time", updateTime);

        Map<String, Object> isActive = new HashMap<>();
        isActive.put("type", "boolean");
        propertiesMap.put("is_active", isActive);

        mappings.put("properties", propertiesMap);
        return mappings;
    }

    /**
     * 获取当前月份的概念索引名称
     * 
     * @return 当前概念索引名（格式：{prefix}_{yyyyMM}）
     */
    public String getCurrentConceptIndex() {
        return properties.getConceptIndexPrefix() + "_" + LocalDate.now().format(MONTH_FORMATTER);
    }

    /**
     * 获取当前月份的文档索引名称
     * 
     * @return 当前文档索引名（格式：{prefix}_{yyyyMM}）
     */
    public String getCurrentDocumentIndex() {
        return properties.getDocumentIndexPrefix() + "_" + LocalDate.now().format(MONTH_FORMATTER);
    }

    /**
     * 获取指定日期的概念索引名称
     * 
     * @param date 指定日期
     * @return 概念索引名
     */
    public String getConceptIndexForDate(LocalDate date) {
        return properties.getConceptIndexPrefix() + "_" + date.format(MONTH_FORMATTER);
    }

    /**
     * 获取指定日期的文档索引名称
     * 
     * @param date 指定日期
     * @return 文档索引名
     */
    public String getDocumentIndexForDate(LocalDate date) {
        return properties.getDocumentIndexPrefix() + "_" + date.format(MONTH_FORMATTER);
    }

    /**
     * 创建当月概念索引
     * 
     * @return 创建是否成功
     */
    public boolean createMonthlyConceptIndex() {
        String newIndex = getCurrentConceptIndex();
        if (esClient.indexExists(newIndex)) {
            log.info("Monthly concept index '{}' already exists", newIndex);
            return true;
        }
        createConceptIndex(newIndex);
        return esClient.indexExists(newIndex);
    }

    /**
     * 创建当月文档索引
     * 
     * @return 创建是否成功
     */
    public boolean createMonthlyDocumentIndex() {
        String newIndex = getCurrentDocumentIndex();
        if (esClient.indexExists(newIndex)) {
            log.info("Monthly document index '{}' already exists", newIndex);
            return true;
        }
        createDocumentIndex(newIndex);
        return esClient.indexExists(newIndex);
    }

    /**
     * 确保指定月份的索引存在
     * 
     * @param date 指定日期
     */
    public void ensureIndicesForMonth(LocalDate date) {
        String conceptIndex = getConceptIndexForDate(date);
        if (!esClient.indexExists(conceptIndex)) {
            createConceptIndex(conceptIndex);
        }

        String documentIndex = getDocumentIndexForDate(date);
        if (!esClient.indexExists(documentIndex)) {
            createDocumentIndex(documentIndex);
        }
    }

    /**
     * 删除指定索引
     * 
     * @param indexName 索引名称
     * @return 删除是否成功
     */
    public boolean deleteIndex(String indexName) {
        boolean success = esClient.deleteIndex(indexName);
        if (success) {
            log.info("Index '{}' deleted successfully", indexName);
        } else {
            log.warn("Failed to delete index '{}'", indexName);
        }
        return success;
    }

    /**
     * 更新生命周期策略
     * 
     * @return 更新是否成功
     */
    public boolean updateLifecyclePolicy() {
        if (!properties.isLifecycleEnabled()) {
            return false;
        }
        createLifecyclePolicyFromConfig();
        return true;
    }

    /**
     * 读取资源文件内容
     * 
     * @param resource 资源文件
     * @return 文件内容字符串
     * @throws IOException 读取异常
     */
    private String readResourceFile(ClassPathResource resource) throws IOException {
        try (InputStream is = resource.getInputStream()) {
            byte[] bytes = new byte[is.available()];
            is.read(bytes);
            return new String(bytes, StandardCharsets.UTF_8);
        }
    }

    /**
     * 获取索引属性配置
     * 
     * @return 索引属性配置
     */
    public OntologyIndexProperties getProperties() {
        return properties;
    }
}