package com.moer.search.ontology;

import com.moer.search.ontology.model.Action;
import com.moer.search.ontology.model.Concept;
import com.moer.search.ontology.model.Instance;
import com.moer.search.ontology.model.Relation;
import com.moer.search.ontology.reasoner.RuleReasoner;
import com.moer.search.ontology.reasoner.SubclassReasoner;
import com.moer.search.ontology.reasoner.TransitiveReasoner;
import com.moer.search.ontology.storage.OntologyStore;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.*;

/**
 * 本体引擎核心类
 * 
 * 作为本体管理的核心组件，负责统一管理概念、关系和实例数据，并协调各推理器进行推理计算。
 * 
 * <p>核心功能：
 * <ul>
 *   <li>概念管理 - 添加、查询、删除概念</li>
 *   <li>关系管理 - 添加、查询、删除关系</li>
 *   <li>实例管理 - 添加、查询、删除实例</li>
 *   <li>子类推理 - 获取子类、父类、判断继承关系</li>
 *   <li>传递推理 - 计算传递闭包、路径查找</li>
 *   <li>规则推理 - 基于规则进行自动推理</li>
 *   <li>查询扩展 - 基于本体进行语义查询扩展</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MoerOntologyEngine {

    /** 本体存储层 */
    private final OntologyStore ontologyStore;

    /** 子类推理器 */
    private final SubclassReasoner subclassReasoner;

    /** 传递推理器 */
    private final TransitiveReasoner transitiveReasoner;

    /** 规则推理器 */
    private final RuleReasoner ruleReasoner;

    /** 引擎是否已初始化 */
    @Getter
    private boolean initialized = false;

    /**
     * 初始化方法
     * 
     * 在Spring容器启动时执行，完成推理器的初始化和默认规则的加载。
     */
    @PostConstruct
    public void initialize() {
        log.info("Initializing MoerOntologyEngine...");
        
        refreshReasoners();
        ruleReasoner.initializeDefaultRules();
        
        initialized = true;
        log.info("MoerOntologyEngine initialized successfully");
    }

    /**
     * 刷新所有推理器的缓存
     * 
     * 将存储层的数据同步到各推理器的内存缓存中。
     */
    public void refreshReasoners() {
        subclassReasoner.updateConceptCache(ontologyStore.getConceptMap());
        transitiveReasoner.updateRelationIndex(ontologyStore.getAllRelations());
        ruleReasoner.updateKnowledgeBase(
            ontologyStore.getConceptMap(), 
            ontologyStore.getRelationMap()
        );
        log.debug("Reasoners refreshed");
    }

    /**
     * 添加概念
     * 
     * @param concept 概念对象
     * @return 添加后的概念对象
     */
    public Concept addConcept(Concept concept) {
        ontologyStore.saveConcept(concept);
        subclassReasoner.addConcept(concept);
        log.info("Concept added: {}", concept.getConceptId());
        return concept;
    }

    /**
     * 批量添加概念
     * 
     * @param concepts 概念列表
     */
    public void addConcepts(List<Concept> concepts) {
        ontologyStore.saveConcepts(concepts);
        refreshReasoners();
        log.info("Batch added {} concepts", concepts.size());
    }

    /**
     * 获取概念
     * 
     * @param conceptId 概念ID
     * @return 概念对象，如果不存在返回null
     */
    public Concept getConcept(String conceptId) {
        return ontologyStore.getConcept(conceptId);
    }

    /**
     * 获取所有概念
     * 
     * @return 概念列表
     */
    public List<Concept> getAllConcepts() {
        return ontologyStore.getAllConcepts();
    }

    /**
     * 删除概念
     * 
     * @param conceptId 概念ID
     * @return 删除成功返回true，失败返回false
     */
    public boolean deleteConcept(String conceptId) {
        Concept concept = ontologyStore.getConcept(conceptId);
        if (concept == null) {
            return false;
        }
        ontologyStore.deleteConcept(conceptId);
        subclassReasoner.removeConcept(conceptId);
        refreshReasoners();
        log.info("Concept deleted: {}", conceptId);
        return true;
    }

    /**
     * 添加关系
     * 
     * @param relation 关系对象
     */
    public void addRelation(Relation relation) {
        ontologyStore.saveRelation(relation);
        transitiveReasoner.addRelation(relation);
        log.info("Relation added: {}", relation.getRelationId());
    }

    /**
     * 批量添加关系
     * 
     * @param relations 关系列表
     */
    public void addRelations(List<Relation> relations) {
        ontologyStore.saveRelations(relations);
        refreshReasoners();
        log.info("Batch added {} relations", relations.size());
    }

    /**
     * 获取关系
     * 
     * @param relationId 关系ID
     * @return 关系对象，如果不存在返回null
     */
    public Relation getRelation(String relationId) {
        return ontologyStore.getRelation(relationId);
    }

    /**
     * 获取所有关系
     * 
     * @return 关系列表
     */
    public List<Relation> getAllRelations() {
        return ontologyStore.getAllRelations();
    }

    /**
     * 删除关系
     * 
     * @param relationId 关系ID
     */
    public void deleteRelation(String relationId) {
        ontologyStore.deleteRelation(relationId);
        transitiveReasoner.removeRelation(relationId);
        refreshReasoners();
        log.info("Relation deleted: {}", relationId);
    }

    /**
     * 添加实例
     * 
     * @param instance 实例对象
     */
    public void addInstance(Instance instance) {
        ontologyStore.saveInstance(instance);
        log.info("Instance added: {}", instance.getInstanceId());
    }

    /**
     * 批量添加实例
     * 
     * @param instances 实例列表
     */
    public void addInstances(List<Instance> instances) {
        ontologyStore.saveInstances(instances);
        log.info("Batch added {} instances", instances.size());
    }

    /**
     * 获取实例
     * 
     * @param instanceId 实例ID
     * @return 实例对象，如果不存在返回null
     */
    public Instance getInstance(String instanceId) {
        return ontologyStore.getInstance(instanceId);
    }

    /**
     * 获取所有实例
     * 
     * @return 实例列表
     */
    public List<Instance> getAllInstances() {
        return ontologyStore.getAllInstances();
    }

    /**
     * 删除实例
     * 
     * @param instanceId 实例ID
     */
    public void deleteInstance(String instanceId) {
        ontologyStore.deleteInstance(instanceId);
        log.info("Instance deleted: {}", instanceId);
    }

    /**
     * 获取所有子类
     * 
     * @param conceptId 概念ID
     * @return 子类ID集合
     */
    public Set<String> getSubclasses(String conceptId) {
        return subclassReasoner.getAllSubclasses(conceptId);
    }

    /**
     * 获取所有父类
     * 
     * @param conceptId 概念ID
     * @return 父类ID集合
     */
    public Set<String> getSuperclasses(String conceptId) {
        return subclassReasoner.getAllSuperclasses(conceptId);
    }

    /**
     * 判断是否为子类关系
     * 
     * @param childId 子概念ID
     * @param parentId 父概念ID
     * @return 如果childId是parentId的子类返回true
     */
    public boolean isSubclass(String childId, String parentId) {
        return subclassReasoner.isSubclassOf(childId, parentId);
    }

    /**
     * 获取祖先概念
     * 
     * @param conceptId 概念ID
     * @return 祖先概念ID集合
     */
    public Set<String> getAncestors(String conceptId) {
        return transitiveReasoner.getAncestors(conceptId);
    }

    /**
     * 获取后代概念
     * 
     * @param conceptId 概念ID
     * @return 后代概念ID集合
     */
    public Set<String> getDescendants(String conceptId) {
        return transitiveReasoner.getDescendants(conceptId);
    }

    /**
     * 判断是否存在传递关系
     * 
     * @param sourceId 源概念ID
     * @param targetId 目标概念ID
     * @param relationType 关系类型
     * @return 如果存在传递关系返回true
     */
    public boolean hasTransitiveRelation(String sourceId, String targetId, String relationType) {
        return transitiveReasoner.hasTransitiveRelation(sourceId, targetId, relationType);
    }

    /**
     * 获取关系路径
     * 
     * @param sourceId 源概念ID
     * @param targetId 目标概念ID
     * @param relationType 关系类型
     * @return 概念ID路径列表，如果不存在路径返回空列表
     */
    public List<String> getRelationPath(String sourceId, String targetId, String relationType) {
        return transitiveReasoner.getTransitivePath(sourceId, targetId, relationType);
    }

    /**
     * 执行所有规则推理
     * 
     * @return 推断出的关系列表
     */
    public List<RuleReasoner.InferredRelation> inferRelations() {
        return ruleReasoner.inferAll();
    }

    /**
     * 针对特定概念执行规则推理
     * 
     * @param conceptId 概念ID
    	 * @return 推断出的与该概念相关的关系列表
     */
    public List<RuleReasoner.InferredRelation> inferFromConcept(String conceptId) {
        return ruleReasoner.inferFromConcept(conceptId);
    }

    /**
     * 搜索概念
     * 
     * @param keyword 搜索关键词
     * @return 匹配的概念列表
     */
    public List<Concept> searchConcepts(String keyword) {
        return ontologyStore.searchConcepts(keyword);
    }

    /**
     * 搜索概念（带分页）
     * 
     * @param keyword 搜索关键词
     * @param pageNum 页码（从1开始）
     * @param pageSize 每页大小
     * @return 包含结果列表和总数的Map
     */
    public Map<String, Object> searchConcepts(String keyword, Integer pageNum, Integer pageSize) {
        List<Concept> results = ontologyStore.searchConcepts(keyword);
        Map<String, Object> resultMap = new HashMap<>();
        
        int total = results.size();
        int fromIndex = (pageNum - 1) * pageSize;
        int toIndex = Math.min(fromIndex + pageSize, total);
        
        if (fromIndex >= total) {
            resultMap.put("data", new ArrayList<>());
        } else {
            resultMap.put("data", results.subList(fromIndex, toIndex));
        }
        resultMap.put("total", total);
        resultMap.put("pageNum", pageNum);
        resultMap.put("pageSize", pageSize);
        
        return resultMap;
    }

    /**
     * 更新概念
     * 
     * @param concept 概念对象
     * @return 更新后的概念对象，如果不存在返回null
     */
    public Concept updateConcept(Concept concept) {
        Concept existing = ontologyStore.getConcept(concept.getConceptId());
        if (existing == null) {
            return null;
        }
        ontologyStore.saveConcept(concept);
        subclassReasoner.updateConcept(concept);
        refreshReasoners();
        log.info("Concept updated: {}", concept.getConceptId());
        return concept;
    }

    /**
     * 获取直接子类
     * 
     * @param conceptId 概念ID
     * @return 直接子类ID集合
     */
    public Set<String> getDirectSubclasses(String conceptId) {
        return subclassReasoner.getDirectSubclasses(conceptId);
    }

    /**
     * 获取直接父类
     * 
     * @param conceptId 概念ID
     * @return 直接父类ID集合
     */
    public Set<String> getDirectSuperclasses(String conceptId) {
        return subclassReasoner.getDirectSuperclasses(conceptId);
    }

    /**
     * 获取子概念对象列表
     * 
     * @param conceptId 概念ID
     * @return 子概念对象列表
     */
    public List<Concept> getChildConcepts(String conceptId) {
        Set<String> childIds = getDirectSubclasses(conceptId);
        List<Concept> children = new ArrayList<>();
        for (String childId : childIds) {
            Concept child = ontologyStore.getConcept(childId);
            if (child != null) {
                children.add(child);
            }
        }
        return children;
    }

    /**
     * 获取父概念对象列表
     * 
     * @param conceptId 概念ID
     * @return 父概念对象列表
     */
    public List<Concept> getParentConcepts(String conceptId) {
        Set<String> parentIds = getDirectSuperclasses(conceptId);
        List<Concept> parents = new ArrayList<>();
        for (String parentId : parentIds) {
            Concept parent = ontologyStore.getConcept(parentId);
            if (parent != null) {
                parents.add(parent);
            }
        }
        return parents;
    }

    /**
     * 查询扩展
     * 
     * @param query 查询词
     * @param expandType 扩展类型（synonym: 同义词扩展, semantic: 语义扩展, concept: 概念扩展）
     * @return 扩展后的查询词列表
     */
    public List<String> expandQuery(String query, String expandType) {
        List<String> expanded = new ArrayList<>();
        expanded.add(query);
        
        Concept concept = ontologyStore.getConcept(query.toLowerCase());
        if (concept != null && concept.getSynonyms() != null) {
            expanded.addAll(concept.getSynonyms());
        }
        
        Set<String> related = getRelatedConcepts(query, null);
        if (related != null && !related.isEmpty()) {
            expanded.addAll(related);
        }
        
        return expanded;
    }

    /**
     * 应用规则推理
     * 
     * @param input 输入数据
     * @return 推理结果列表
     */
    public List<Map<String, Object>> applyRules(Map<String, Object> input) {
        List<Map<String, Object>> results = new ArrayList<>();
        List<RuleReasoner.InferredRelation> inferredRelations = inferRelations();
        
        for (RuleReasoner.InferredRelation relation : inferredRelations) {
            Map<String, Object> result = new HashMap<>();
            result.put("source", relation.getSourceId());
            result.put("target", relation.getTargetId());
            result.put("relationType", relation.getRelationType());
            result.put("confidence", relation.getConfidence());
            results.add(result);
        }
        
        return results;
    }

    /**
     * 获取传递闭包
     * 
     * @param conceptId 概念ID
     * @param relationType 关系类型
     * @return 传递闭包中的概念ID集合
     */
    public Set<String> getTransitiveClosure(String conceptId, String relationType) {
        return transitiveReasoner.getRelatedConcepts(conceptId, relationType);
    }

    /**
     * 查找路径
     * 
     * @param sourceId 源概念ID
     * @param targetId 目标概念ID
     * @return 路径列表（每条路径是概念ID列表）
     */
    public List<List<String>> findPath(String sourceId, String targetId) {
        List<List<String>> paths = new ArrayList<>();
        List<String> path = getRelationPath(sourceId, targetId, "is_a");
        if (!path.isEmpty()) {
            paths.add(path);
        }
        return paths;
    }

    /**
     * 获取指定概念的所有实例
     * 
     * @param conceptId 概念ID
     * @return 实例列表
     */
    public List<Instance> getInstancesByConcept(String conceptId) {
        return ontologyStore.getInstancesByConcept(conceptId);
    }

    /**
     * 获取本体统计信息
     * 
     * @return 统计信息Map，包含概念数、关系数、实例数、规则数和初始化状态
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("conceptCount", ontologyStore.getConceptCount());
        stats.put("relationCount", ontologyStore.getRelationCount());
        stats.put("instanceCount", ontologyStore.getInstanceCount());
        stats.put("ruleCount", ruleReasoner.getRuleCount());
        stats.put("initialized", initialized);
        return stats;
    }

    /**
     * 清空本体数据
     * 
     * 清空所有概念、关系和实例数据，并重新初始化默认本体结构。
     */
    public void clearOntology() {
        ontologyStore.clearAll();
        refreshReasoners();
        log.info("Ontology cleared");
    }

    /**
     * 导出本体数据为JSON格式
     * 
     * @return JSON字符串
     */
    public String exportOntology() {
        return ontologyStore.exportOntologyJson();
    }

    /**
     * 从JSON格式导入本体数据
     * 
     * @param json JSON字符串
     */
    public void importOntology(String json) {
        ontologyStore.importOntologyJson(json);
        refreshReasoners();
        log.info("Ontology imported");
    }

    /**
     * 获取概念层次结构
     * 
     * @param conceptId 概念ID
     * @return 层次结构字符串列表
     */
    public List<String> getConceptHierarchy(String conceptId) {
        return subclassReasoner.getSubclassHierarchy(conceptId);
    }

    /**
     * 获取两个概念的最近公共父类
     * 
     * @param conceptId1 概念ID1
     * @param conceptId2 概念ID2
     * @return 最近公共父类ID，如果不存在返回null
     */
    public String getLeastCommonSuperclass(String conceptId1, String conceptId2) {
        return subclassReasoner.getLeastCommonSuperclass(conceptId1, conceptId2);
    }

    /**
     * 获取相关概念
     * 
     * @param conceptId 概念ID
     * @param relationType 关系类型（可选，为null时返回所有相关概念）
     * @return 相关概念ID集合
     */
    public Set<String> getRelatedConcepts(String conceptId, String relationType) {
        return transitiveReasoner.getRelatedConcepts(conceptId, relationType);
    }

    /**
     * 添加自定义规则
     * 
     * @param name 规则名称
     * @param pattern 规则模式
     * @param action 规则动作
     */
    public void addCustomRule(String name, String pattern, RuleReasoner.RuleAction action) {
        ruleReasoner.addCustomRule(name, pattern, action);
        log.info("Custom rule added: {}", name);
    }

    // ==================== Action Management ====================

    /**
     * 添加动作
     * 
     * @param action 动作对象
     * @return 添加后的动作对象
     */
    public Action addAction(Action action) {
        ontologyStore.saveAction(action);
        log.info("Action added: {}", action.getActionId());
        return action;
    }

    /**
     * 批量添加动作
     * 
     * @param actions 动作列表
     */
    public void addActions(List<Action> actions) {
        ontologyStore.saveActions(actions);
        log.info("Batch added {} actions", actions.size());
    }

    /**
     * 获取动作
     * 
     * @param actionId 动作ID
     * @return 动作对象，如果不存在返回null
     */
    public Action getAction(String actionId) {
        return ontologyStore.getAction(actionId);
    }

    /**
     * 获取所有动作
     * 
     * @return 动作列表
     */
    public List<Action> getAllActions() {
        return ontologyStore.getAllActions();
    }

    /**
     * 获取启用的动作
     * 
     * @return 启用的动作列表
     */
    public List<Action> getEnabledActions() {
        return ontologyStore.getEnabledActions();
    }

    /**
     * 根据类型获取动作
     * 
     * @param actionType 动作类型
     * @return 动作列表
     */
    public List<Action> getActionsByType(Action.ActionType actionType) {
        return ontologyStore.getActionsByType(actionType);
    }

    /**
     * 根据领域获取动作
     * 
     * @param domain 领域名称
     * @return 动作列表
     */
    public List<Action> getActionsByDomain(String domain) {
        return ontologyStore.getActionsByDomain(domain);
    }

    /**
     * 根据概念获取动作
     * 
     * @param conceptId 概念ID
     * @return 动作列表
     */
    public List<Action> getActionsByConcept(String conceptId) {
        return ontologyStore.getActionsByConcept(conceptId);
    }

    /**
     * 删除动作
     * 
     * @param actionId 动作ID
     * @return 删除成功返回true，失败返回false
     */
    public boolean deleteAction(String actionId) {
        Action action = ontologyStore.getAction(actionId);
        if (action == null) {
            return false;
        }
        ontologyStore.deleteAction(actionId);
        log.info("Action deleted: {}", actionId);
        return true;
    }

    /**
     * 更新动作
     * 
     * @param action 动作对象
     * @return 更新后的动作对象，如果不存在返回null
     */
    public Action updateAction(Action action) {
        Action existing = ontologyStore.getAction(action.getActionId());
        if (existing == null) {
            return null;
        }
        ontologyStore.saveAction(action);
        log.info("Action updated: {}", action.getActionId());
        return action;
    }

    /**
     * 搜索动作
     * 
     * @param keyword 搜索关键词
     * @return 匹配的动作列表
     */
    public List<Action> searchActions(String keyword) {
        return ontologyStore.searchActions(keyword);
    }

    /**
     * 获取动作数量
     * 
     * @return 动作数量
     */
    public long getActionCount() {
        return ontologyStore.getActionCount();
    }

    /**
     * 意图识别 - 根据用户查询匹配最合适的动作
     * 
     * @param query 用户查询
     * @param topN 返回前N个匹配结果
     * @return 匹配的动作列表（按置信度排序）
     */
    public List<Map<String, Object>> recognizeIntent(String query, int topN) {
        List<Map<String, Object>> results = new ArrayList<>();
        List<Action> allActions = ontologyStore.getEnabledActions();
        
        for (Action action : allActions) {
            double confidence = calculateConfidence(query, action);
            if (confidence > 0) {
                Map<String, Object> match = new HashMap<>();
                match.put("action", action);
                match.put("confidence", confidence);
                results.add(match);
            }
        }
        
        results.sort((a, b) -> Double.compare(
            (Double) b.get("confidence"), 
            (Double) a.get("confidence")
        ));
        
        if (results.size() > topN) {
            return results.subList(0, topN);
        }
        return results;
    }

    /**
     * 计算查询与动作的匹配置信度
     * 
     * @param query 用户查询
     * @param action 动作对象
     * @return 置信度（0-1）
     */
    private double calculateConfidence(String query, Action action) {
        double confidence = 0.0;
        String lowerQuery = query.toLowerCase();
        
        // 检查动作名称匹配
        if (action.getActionName() != null && action.getActionName().toLowerCase().contains(lowerQuery)) {
            confidence += 0.4;
        }
        
        // 检查英文名称匹配
        if (action.getActionNameEn() != null && action.getActionNameEn().toLowerCase().contains(lowerQuery)) {
            confidence += 0.2;
        }
        
        // 检查同义词匹配
        if (action.getSynonyms() != null) {
            for (String synonym : action.getSynonyms()) {
                if (synonym.toLowerCase().contains(lowerQuery)) {
                    confidence += 0.2;
                    break;
                }
            }
        }
        
        // 检查示例匹配
        if (action.getExamples() != null) {
            for (String example : action.getExamples()) {
                if (example.toLowerCase().contains(lowerQuery)) {
                    confidence += 0.15;
                    break;
                }
            }
        }
        
        // 检查描述匹配
        if (action.getDescription() != null && action.getDescription().toLowerCase().contains(lowerQuery)) {
            confidence += 0.15;
        }
        
        // 检查触发条件匹配
        if (action.getTrigger() != null && action.getTrigger().toLowerCase().contains(lowerQuery)) {
            confidence += 0.1;
        }
        
        return Math.min(confidence, 1.0);
    }
}