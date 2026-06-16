package com.moer.search.ontology.storage;

import com.alibaba.fastjson2.JSON;
import com.moer.search.ontology.model.Concept;
import com.moer.search.ontology.model.Instance;
import com.moer.search.ontology.model.Relation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 本体存储层
 * 
 * 负责本体数据的持久化存储和管理，提供概念、关系、实例的增删改查操作。
 * 
 * <p>核心功能：
 * <ul>
 *   <li>概念管理 - 添加、查询、删除概念</li>
 *   <li>关系管理 - 添加、查询、删除关系</li>
 *   <li>实例管理 - 添加、查询、删除实例</li>
 *   <li>数据导入导出 - 支持JSON格式的导入导出</li>
 *   <li>概念搜索 - 支持关键词搜索</li>
 * </ul>
 * 
 * <p>存储实现：
 * <ul>
 *   <li>内存存储 - 基于HashMap实现</li>
 *   <li>支持持久化到Elasticsearch（预留）</li>
 *   <li>自动维护概念的父子关系</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Component
public class OntologyStore {

    /** 概念索引名称 */
    @Value("${ontology.elastic.index.concept:moer_ontology}")
    private String conceptIndex;

    /** 文档索引名称 */
    @Value("${ontology.elastic.index.document:moer_documents}")
    private String documentIndex;

    /** 概念存储 */
    private final Map<String, Concept> conceptStore = new HashMap<>();

    /** 关系存储 */
    private final Map<String, Relation> relationStore = new HashMap<>();

    /** 实例存储 */
    private final Map<String, Instance> instanceStore = new HashMap<>();

    /**
     * 初始化方法
     * 
     * 在Spring容器启动时执行，创建默认的本体结构（Root -> Entity -> Document）。
     */
    @PostConstruct
    public void init() {
        log.info("OntologyStore initialized with indices: concept={}, document={}", 
            conceptIndex, documentIndex);
        createDefaultOntology();
    }

    /**
     * 创建默认本体结构
     * 
     * 创建基础的概念层次结构：
     * <ul>
     *   <li>Root - 根概念</li>
     *   <li>Entity - 实体概念（继承自Root）</li>
     *   <li>Document - 文档概念（继承自Entity）</li>
     * </ul>
     */
    private void createDefaultOntology() {
        Concept root = Concept.builder()
            .conceptId("root")
            .conceptName("Root")
            .conceptNameEn("Root")
            .description("Top-level concept")
            .isAbstract(true)
            .build();
        conceptStore.put("root", root);

        Concept entity = Concept.builder()
            .conceptId("entity")
            .conceptName("实体")
            .conceptNameEn("Entity")
            .description("General entity concept")
            .isAbstract(true)
            .build();
        entity.addParent("root");
        conceptStore.put("entity", entity);

        Concept document = Concept.builder()
            .conceptId("document")
            .conceptName("文档")
            .conceptNameEn("Document")
            .description("Document entity")
            .isAbstract(false)
            .build();
        document.addParent("entity");
        conceptStore.put("document", document);

        Relation relation = Relation.builder()
            .relationId("rel_entity_root")
            .sourceConceptId("entity")
            .targetConceptId("root")
            .relationType(Relation.TYPE_IS_A)
            .relationName("is_a")
            .weight(10)
            .isTransitive(true)
            .build();
        relationStore.put("rel_entity_root", relation);

        Relation docRelation = Relation.builder()
            .relationId("rel_document_entity")
            .sourceConceptId("document")
            .targetConceptId("entity")
            .relationType(Relation.TYPE_IS_A)
            .relationName("is_a")
            .weight(10)
            .isTransitive(true)
            .build();
        relationStore.put("rel_document_entity", docRelation);

        log.info("Default ontology created with {} concepts and {} relations", 
            conceptStore.size(), relationStore.size());
    }

    /**
     * 保存概念
     * 
     * @param concept 概念对象
     */
    public void saveConcept(Concept concept) {
        concept.setUpdateTime(System.currentTimeMillis());
        if (concept.getCreateTime() == null) {
            concept.setCreateTime(System.currentTimeMillis());
        }
        conceptStore.put(concept.getConceptId(), concept);
        
        updateParentChildRelations(concept);
        log.debug("Concept saved: {}", concept.getConceptId());
    }

    /**
     * 批量保存概念
     * 
     * @param concepts 概念列表
     */
    public void saveConcepts(List<Concept> concepts) {
        for (Concept concept : concepts) {
            saveConcept(concept);
        }
        log.info("Batch saved {} concepts", concepts.size());
    }

    /**
     * 获取概念
     * 
     * @param conceptId 概念ID
     * @return 概念对象，如果不存在返回null
     */
    public Concept getConcept(String conceptId) {
        return conceptStore.get(conceptId);
    }

    /**
     * 获取所有概念
     * 
     * @return 概念列表
     */
    public List<Concept> getAllConcepts() {
        return new ArrayList<>(conceptStore.values());
    }

    /**
     * 获取概念映射
     * 
     * @return 概念ID -> 概念对象的映射
     */
    public Map<String, Concept> getConceptMap() {
        return new HashMap<>(conceptStore);
    }

    /**
     * 删除概念
     * 
     * @param conceptId 概念ID
     */
    public void deleteConcept(String conceptId) {
        conceptStore.remove(conceptId);
        relationStore.entrySet().removeIf(entry -> 
            entry.getValue().getSourceConceptId().equals(conceptId) ||
            entry.getValue().getTargetConceptId().equals(conceptId));
        log.debug("Concept deleted: {}", conceptId);
    }

    /**
     * 保存关系
     * 
     * @param relation 关系对象
     */
    public void saveRelation(Relation relation) {
        relation.setUpdateTime(System.currentTimeMillis());
        if (relation.getCreateTime() == null) {
            relation.setCreateTime(System.currentTimeMillis());
        }
        
        if (!relationStore.containsKey(relation.getRelationId())) {
            relationStore.put(relation.getRelationId(), relation);
            
            Concept sourceConcept = conceptStore.get(relation.getSourceConceptId());
            if (sourceConcept != null) {
                sourceConcept.addRelation(relation);
            }
        }
        log.debug("Relation saved: {}", relation.getRelationId());
    }

    /**
     * 批量保存关系
     * 
     * @param relations 关系列表
     */
    public void saveRelations(List<Relation> relations) {
        for (Relation relation : relations) {
            saveRelation(relation);
        }
        log.info("Batch saved {} relations", relations.size());
    }

    /**
     * 获取关系
     * 
     * @param relationId 关系ID
     * @return 关系对象，如果不存在返回null
     */
    public Relation getRelation(String relationId) {
        return relationStore.get(relationId);
    }

    /**
     * 获取所有关系
     * 
     * @return 关系列表
     */
    public List<Relation> getAllRelations() {
        return new ArrayList<>(relationStore.values());
    }

    /**
     * 获取关系映射
     * 
     * @return 关系ID -> 关系对象的映射
     */
    public Map<String, Relation> getRelationMap() {
        return new HashMap<>(relationStore);
    }

    /**
     * 删除关系
     * 
     * @param relationId 关系ID
     */
    public void deleteRelation(String relationId) {
        Relation relation = relationStore.remove(relationId);
        if (relation != null) {
            Concept sourceConcept = conceptStore.get(relation.getSourceConceptId());
            if (sourceConcept != null && sourceConcept.getRelations() != null) {
                sourceConcept.getRelations().removeIf(r -> r.getRelationId().equals(relationId));
            }
        }
        log.debug("Relation deleted: {}", relationId);
    }

    /**
     * 保存实例
     * 
     * @param instance 实例对象
     */
    public void saveInstance(Instance instance) {
        instance.setUpdateTime(System.currentTimeMillis());
        if (instance.getCreateTime() == null) {
            instance.setCreateTime(System.currentTimeMillis());
        }
        instanceStore.put(instance.getInstanceId(), instance);
        log.debug("Instance saved: {}", instance.getInstanceId());
    }

    /**
     * 批量保存实例
     * 
     * @param instances 实例列表
     */
    public void saveInstances(List<Instance> instances) {
        for (Instance instance : instances) {
            saveInstance(instance);
        }
        log.info("Batch saved {} instances", instances.size());
    }

    /**
     * 获取实例
     * 
     * @param instanceId 实例ID
     * @return 实例对象，如果不存在返回null
     */
    public Instance getInstance(String instanceId) {
        return instanceStore.get(instanceId);
    }

    /**
     * 获取所有实例
     * 
     * @return 实例列表
     */
    public List<Instance> getAllInstances() {
        return new ArrayList<>(instanceStore.values());
    }

    /**
     * 获取指定概念的实例
     * 
     * @param conceptId 概念ID
     * @return 实例列表
     */
    public List<Instance> getInstancesByConcept(String conceptId) {
        return instanceStore.values().stream()
            .filter(inst -> conceptId.equals(inst.getConceptId()))
            .collect(Collectors.toList());
    }

    /**
     * 删除实例
     * 
     * @param instanceId 实例ID
     */
    public void deleteInstance(String instanceId) {
        instanceStore.remove(instanceId);
        log.debug("Instance deleted: {}", instanceId);
    }

    /**
     * 更新父子关系
     * 
     * 当保存概念时，自动更新父概念的子概念列表。
     * 
     * @param concept 概念对象
     */
    private void updateParentChildRelations(Concept concept) {
        if (concept.getParents() != null) {
            for (String parentId : concept.getParents()) {
                Concept parent = conceptStore.get(parentId);
                if (parent != null) {
                    parent.addChild(concept.getConceptId());
                }
            }
        }
    }

    /**
     * 搜索概念
     * 
     * 支持按名称（中文/英文）和描述进行模糊搜索。
     * 
     * @param keyword 搜索关键词
     * @return 匹配的概念列表
     */
    public List<Concept> searchConcepts(String keyword) {
        if (keyword == null || keyword.isEmpty()) {
            return getAllConcepts();
        }
        
        String lowerKeyword = keyword.toLowerCase();
        return conceptStore.values().stream()
            .filter(c -> c.getConceptName() != null && c.getConceptName().toLowerCase().contains(lowerKeyword) ||
                        c.getConceptNameEn() != null && c.getConceptNameEn().toLowerCase().contains(lowerKeyword) ||
                        c.getDescription() != null && c.getDescription().toLowerCase().contains(lowerKeyword))
            .collect(Collectors.toList());
    }

    /**
     * 获取指定源概念的关系
     * 
     * @param sourceId 源概念ID
     * @return 关系列表
     */
    public List<Relation> getRelationsBySource(String sourceId) {
        return relationStore.values().stream()
            .filter(r -> sourceId.equals(r.getSourceConceptId()))
            .collect(Collectors.toList());
    }

    /**
     * 获取指定目标概念的关系
     * 
     * @param targetId 目标概念ID
     * @return 关系列表
     */
    public List<Relation> getRelationsByTarget(String targetId) {
        return relationStore.values().stream()
            .filter(r -> targetId.equals(r.getTargetConceptId()))
            .collect(Collectors.toList());
    }

    /**
     * 获取概念数量
     * 
     * @return 概念数量
     */
    public long getConceptCount() {
        return conceptStore.size();
    }

    /**
     * 获取关系数量
     * 
     * @return 关系数量
     */
    public long getRelationCount() {
        return relationStore.size();
    }

    /**
     * 获取实例数量
     * 
     * @return 实例数量
     */
    public long getInstanceCount() {
        return instanceStore.size();
    }

    /**
     * 清空所有数据
     * 
     * 清空所有概念、关系和实例，并重新创建默认本体结构。
     */
    public void clearAll() {
        conceptStore.clear();
        relationStore.clear();
        instanceStore.clear();
        createDefaultOntology();
        log.info("Ontology store cleared and reinitialized");
    }

    /**
     * 导出本体数据为JSON格式
     * 
     * @return JSON字符串
     */
    public String exportOntologyJson() {
        Map<String, Object> ontology = new HashMap<>();
        ontology.put("concepts", conceptStore.values());
        ontology.put("relations", relationStore.values());
        ontology.put("instances", instanceStore.values());
        ontology.put("exportTime", System.currentTimeMillis());
        return JSON.toJSONString(ontology);
    }

    /**
     * 从JSON格式导入本体数据
     * 
     * @param json JSON字符串
     */
    public void importOntologyJson(String json) {
        try {
            Map<String, Object> ontology = JSON.parseObject(json);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> conceptMaps = (List<Map<String, Object>>) ontology.get("concepts");
            if (conceptMaps != null) {
                for (Map<String, Object> map : conceptMaps) {
                    Concept concept = JSON.parseObject(JSON.toJSONString(map), Concept.class);
                    saveConcept(concept);
                }
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> relationMaps = (List<Map<String, Object>>) ontology.get("relations");
            if (relationMaps != null) {
                for (Map<String, Object> map : relationMaps) {
                    Relation relation = JSON.parseObject(JSON.toJSONString(map), Relation.class);
                    saveRelation(relation);
                }
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> instanceMaps = (List<Map<String, Object>>) ontology.get("instances");
            if (instanceMaps != null) {
                for (Map<String, Object> map : instanceMaps) {
                    Instance instance = JSON.parseObject(JSON.toJSONString(map), Instance.class);
                    saveInstance(instance);
                }
            }

            log.info("Ontology imported successfully");
        } catch (Exception e) {
            log.error("Failed to import ontology: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to import ontology", e);
        }
    }
}