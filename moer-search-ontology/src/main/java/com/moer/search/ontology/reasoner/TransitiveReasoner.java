package com.moer.search.ontology.reasoner;

import com.moer.search.ontology.model.Relation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 传递推理器
 * 
 * 负责处理概念之间的传递关系，支持传递闭包计算、路径查找等操作。
 * 
 * <p>核心功能：
 * <ul>
 *   <li>计算传递闭包</li>
 *   <li>判断传递关系</li>
 *   <li>查找关系路径</li>
 *   <li>获取祖先/后代概念</li>
 *   <li>查找相关概念</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Component
public class TransitiveReasoner {

    /** 关系索引：源概念ID -> 关系列表 */
    private final Map<String, List<Relation>> relationIndex = new HashMap<>();

    /** 传递缓存：源概念ID -> 关系类型 -> 目标概念ID集合 */
    private final Map<String, Map<String, Set<String>>> transitiveCache = new HashMap<>();

    /**
     * 更新关系索引
     * 
     * @param relations 关系列表
     */
    public void updateRelationIndex(List<Relation> relations) {
        relationIndex.clear();
        for (Relation relation : relations) {
            relationIndex.computeIfAbsent(relation.getSourceConceptId(), k -> new ArrayList<>()).add(relation);
        }
        invalidateCache();
    }

    /**
     * 添加单个关系
     * 
     * @param relation 关系对象
     */
    public void addRelation(Relation relation) {
        relationIndex.computeIfAbsent(relation.getSourceConceptId(), k -> new ArrayList<>()).add(relation);
        invalidateCache();
    }

    /**
     * 移除关系
     * 
     * @param relationId 关系ID
     */
    public void removeRelation(String relationId) {
        for (List<Relation> relations : relationIndex.values()) {
            relations.removeIf(r -> r.getRelationId().equals(relationId));
        }
        invalidateCache();
    }

    /**
     * 计算传递闭包
     * 
     * @param sourceId 源概念ID
     * @param relationType 关系类型
     * @return 所有可达的目标概念ID集合
     */
    public Set<String> getTransitiveClosure(String sourceId, String relationType) {
        if (transitiveCache.containsKey(sourceId) && transitiveCache.get(sourceId).containsKey(relationType)) {
            return transitiveCache.get(sourceId).get(relationType);
        }

        Set<String> closure = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();

        queue.add(sourceId);
        visited.add(sourceId);

        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            List<Relation> relations = relationIndex.getOrDefault(currentId, Collections.emptyList());

            for (Relation relation : relations) {
                if (relation.getRelationType().equals(relationType)) {
                    String targetId = relation.getTargetConceptId();
                    if (!visited.contains(targetId)) {
                        visited.add(targetId);
                        closure.add(targetId);
                        queue.add(targetId);
                    }
                }
            }
        }

        transitiveCache.computeIfAbsent(sourceId, k -> new HashMap<>()).put(relationType, closure);
        return closure;
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
        Set<String> closure = getTransitiveClosure(sourceId, relationType);
        return closure.contains(targetId);
    }

    /**
     * 查找关系路径
     * 
     * @param sourceId 源概念ID
     * @param targetId 目标概念ID
     * @param relationType 关系类型
     * @return 概念ID路径列表，如果不存在路径返回空列表
     */
    public List<String> getTransitivePath(String sourceId, String targetId, String relationType) {
        Map<String, String> parentMap = new HashMap<>();
        Queue<String> queue = new LinkedList<>();
        Set<String> visited = new HashSet<>();

        queue.add(sourceId);
        visited.add(sourceId);
        parentMap.put(sourceId, null);

        while (!queue.isEmpty()) {
            String currentId = queue.poll();

            if (currentId.equals(targetId)) {
                return reconstructPath(parentMap, targetId);
            }

            List<Relation> relations = relationIndex.getOrDefault(currentId, Collections.emptyList());
            for (Relation relation : relations) {
                if (relation.getRelationType().equals(relationType)) {
                    String nextId = relation.getTargetConceptId();
                    if (!visited.contains(nextId)) {
                        visited.add(nextId);
                        parentMap.put(nextId, currentId);
                        queue.add(nextId);
                    }
                }
            }
        }

        return Collections.emptyList();
    }

    /**
     * 重构路径
     * 
     * @param parentMap 父节点映射
     * @param targetId 目标概念ID
     * @return 路径列表
     */
    private List<String> reconstructPath(Map<String, String> parentMap, String targetId) {
        List<String> path = new ArrayList<>();
        String currentId = targetId;

        while (currentId != null) {
            path.add(currentId);
            currentId = parentMap.get(currentId);
        }

        Collections.reverse(path);
        return path;
    }

    /**
     * 获取所有传递关系
     * 
     * @param sourceId 源概念ID
     * @return 关系类型 -> 目标概念ID集合的映射
     */
    public Map<String, Set<String>> getAllTransitiveRelations(String sourceId) {
        Map<String, Set<String>> result = new HashMap<>();

        for (Relation relation : relationIndex.getOrDefault(sourceId, Collections.emptyList())) {
            String type = relation.getRelationType();
            result.put(type, getTransitiveClosure(sourceId, type));
        }

        return result;
    }

    /**
     * 获取祖先概念（基于is_a关系）
     * 
     * @param conceptId 概念ID
     * @return 祖先概念ID集合
     */
    public Set<String> getAncestors(String conceptId) {
        return getTransitiveClosure(conceptId, Relation.TYPE_IS_A);
    }

    /**
     * 获取后代概念（基于is_a关系）
     * 
     * @param conceptId 概念ID
     * @return 后代概念ID集合
     */
    public Set<String> getDescendants(String conceptId) {
        Set<String> descendants = new HashSet<>();
        
        for (Map.Entry<String, List<Relation>> entry : relationIndex.entrySet()) {
            for (Relation relation : entry.getValue()) {
                if (relation.getRelationType().equals(Relation.TYPE_IS_A) && 
                    hasTransitiveRelation(relation.getSourceConceptId(), conceptId, Relation.TYPE_IS_A)) {
                    descendants.add(relation.getSourceConceptId());
                }
            }
        }

        return descendants;
    }

    /**
     * 获取相关概念
     * 
     * @param conceptId 概念ID
     * @param relationType 关系类型（可选，为null时返回所有相关概念）
     * @return 相关概念ID集合
     */
    public Set<String> getRelatedConcepts(String conceptId, String relationType) {
        Set<String> related = new HashSet<>();
        
        if (relationType != null) {
            for (List<Relation> relations : relationIndex.values()) {
                for (Relation relation : relations) {
                    if (relation.getRelationType().equals(relationType)) {
                        if (relation.getSourceConceptId().equals(conceptId)) {
                            related.add(relation.getTargetConceptId());
                        } else if (relation.getTargetConceptId().equals(conceptId)) {
                            related.add(relation.getSourceConceptId());
                        }
                    }
                }
            }
        } else {
            for (List<Relation> relations : relationIndex.values()) {
                for (Relation relation : relations) {
                    if (relation.getSourceConceptId().equals(conceptId)) {
                        related.add(relation.getTargetConceptId());
                    } else if (relation.getTargetConceptId().equals(conceptId)) {
                        related.add(relation.getSourceConceptId());
                    }
                }
            }
        }

        return related;
    }

    /**
     * 获取关系数量
     * 
     * @return 关系数量
     */
    public int getRelationCount() {
        int count = 0;
        for (List<Relation> relations : relationIndex.values()) {
            count += relations.size();
        }
        return count;
    }

    /**
     * 使缓存失效
     */
    private void invalidateCache() {
        transitiveCache.clear();
    }

    /**
     * 清空索引
     */
    public void clearIndex() {
        relationIndex.clear();
        invalidateCache();
    }
}