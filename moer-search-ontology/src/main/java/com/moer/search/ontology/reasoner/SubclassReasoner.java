package com.moer.search.ontology.reasoner;

import com.moer.search.ontology.model.Concept;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * 子类推理器
 * 
 * 负责处理概念之间的继承关系，支持获取子类、父类、判断继承关系等操作。
 * 
 * <p>核心功能：
 * <ul>
 *   <li>获取直接子类/父类</li>
 *   <li>获取所有子类/父类（传递闭包）</li>
 *   <li>判断继承关系</li>
 *   <li>构建概念层次结构</li>
 *   <li>查找公共父类和最近公共父类</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Component
public class SubclassReasoner {

    /** 概念缓存 */
    private final Map<String, Concept> conceptCache = new HashMap<>();

    /** 子类缓存：概念ID -> 所有子类ID集合 */
    private final Map<String, Set<String>> subclassCache = new HashMap<>();

    /** 父类缓存：概念ID -> 所有父类ID集合 */
    private final Map<String, Set<String>> superclassCache = new HashMap<>();

    /**
     * 更新概念缓存
     * 
     * @param concepts 概念映射
     */
    public void updateConceptCache(Map<String, Concept> concepts) {
        conceptCache.clear();
        conceptCache.putAll(concepts);
        invalidateCaches();
    }

    /**
     * 添加单个概念到缓存
     * 
     * @param concept 概念对象
     */
    public void addConcept(Concept concept) {
        conceptCache.put(concept.getConceptId(), concept);
        invalidateCaches();
    }

    /**
     * 从缓存中移除概念
     * 
     * @param conceptId 概念ID
     */
    public void removeConcept(String conceptId) {
        conceptCache.remove(conceptId);
        invalidateCaches();
    }

    /**
     * 获取直接子类
     * 
     * @param conceptId 概念ID
     * @return 直接子类ID集合
     */
    public Set<String> getDirectSubclasses(String conceptId) {
        Set<String> subclasses = new HashSet<>();
        for (Concept concept : conceptCache.values()) {
            if (concept.getParents() != null && concept.getParents().contains(conceptId)) {
                subclasses.add(concept.getConceptId());
            }
        }
        return subclasses;
    }

    /**
     * 获取直接父类
     * 
     * @param conceptId 概念ID
     * @return 直接父类ID集合
     */
    public Set<String> getDirectSuperclasses(String conceptId) {
        Concept concept = conceptCache.get(conceptId);
        return concept != null && concept.getParents() != null 
            ? new HashSet<>(concept.getParents()) 
            : new HashSet<>();
    }

    /**
     * 获取所有子类（传递闭包）
     * 
     * @param conceptId 概念ID
     * @return 所有子类ID集合（包括间接子类）
     */
    public Set<String> getAllSubclasses(String conceptId) {
        if (subclassCache.containsKey(conceptId)) {
            return subclassCache.get(conceptId);
        }

        Set<String> allSubclasses = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(conceptId);

        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            Set<String> directSubclasses = getDirectSubclasses(currentId);
            
            for (String subclassId : directSubclasses) {
                if (!allSubclasses.contains(subclassId)) {
                    allSubclasses.add(subclassId);
                    queue.add(subclassId);
                }
            }
        }

        subclassCache.put(conceptId, allSubclasses);
        return allSubclasses;
    }

    /**
     * 获取所有父类（传递闭包）
     * 
     * @param conceptId 概念ID
     * @return 所有父类ID集合（包括间接父类）
     */
    public Set<String> getAllSuperclasses(String conceptId) {
        if (superclassCache.containsKey(conceptId)) {
            return superclassCache.get(conceptId);
        }

        Set<String> allSuperclasses = new HashSet<>();
        Queue<String> queue = new LinkedList<>();
        queue.add(conceptId);

        while (!queue.isEmpty()) {
            String currentId = queue.poll();
            Set<String> directSuperclasses = getDirectSuperclasses(currentId);

            for (String superclassId : directSuperclasses) {
                if (!allSuperclasses.contains(superclassId)) {
                    allSuperclasses.add(superclassId);
                    queue.add(superclassId);
                }
            }
        }

        superclassCache.put(conceptId, allSuperclasses);
        return allSuperclasses;
    }

    /**
     * 判断是否为子类关系
     * 
     * @param subclassId 子概念ID
     * @param superclassId 父概念ID
     * @return 如果subclassId是superclassId的子类返回true
     */
    public boolean isSubclassOf(String subclassId, String superclassId) {
        if (subclassId.equals(superclassId)) {
            return true;
        }
        Set<String> superclasses = getAllSuperclasses(subclassId);
        return superclasses.contains(superclassId);
    }

    /**
     * 判断是否为父类关系
     * 
     * @param superclassId 父概念ID
     * @param subclassId 子概念ID
     * @return 如果superclassId是subclassId的父类返回true
     */
    public boolean isSuperclassOf(String superclassId, String subclassId) {
        return isSubclassOf(subclassId, superclassId);
    }

    /**
     * 获取子类层次结构
     * 
     * @param conceptId 概念ID
     * @return 层次结构字符串列表，带缩进表示层级
     */
    public List<String> getSubclassHierarchy(String conceptId) {
        List<String> hierarchy = new ArrayList<>();
        buildHierarchy(conceptId, 0, hierarchy);
        return hierarchy;
    }

    /**
     * 递归构建层次结构
     * 
     * @param conceptId 概念ID
     * @param depth 当前深度
     * @param hierarchy 层次结构列表
     */
    private void buildHierarchy(String conceptId, int depth, List<String> hierarchy) {
        Concept concept = conceptCache.get(conceptId);
        if (concept == null) {
            return;
        }

        StringBuilder prefix = new StringBuilder();
        for (int i = 0; i < depth; i++) {
            prefix.append("  ");
        }
        hierarchy.add(prefix + concept.getConceptName());

        Set<String> subclasses = getDirectSubclasses(conceptId);
        List<String> sortedSubclasses = new ArrayList<>(subclasses);
        sortedSubclasses.sort(Comparator.naturalOrder());

        for (String subclassId : sortedSubclasses) {
            buildHierarchy(subclassId, depth + 1, hierarchy);
        }
    }

    /**
     * 获取两个概念的公共父类
     * 
     * @param conceptId1 概念ID1
     * @param conceptId2 概念ID2
     * @return 公共父类ID集合
     */
    public Set<String> getCommonSuperclasses(String conceptId1, String conceptId2) {
        Set<String> superclasses1 = getAllSuperclasses(conceptId1);
        Set<String> superclasses2 = getAllSuperclasses(conceptId2);
        
        superclasses1.retainAll(superclasses2);
        return superclasses1;
    }

    /**
     * 获取两个概念的最近公共父类
     * 
     * @param conceptId1 概念ID1
     * @param conceptId2 概念ID2
     * @return 最近公共父类ID，如果不存在返回null
     */
    public String getLeastCommonSuperclass(String conceptId1, String conceptId2) {
        Set<String> commonSuperclasses = getCommonSuperclasses(conceptId1, conceptId2);
        
        if (commonSuperclasses.isEmpty()) {
            return null;
        }

        String lcs = null;
        int maxDepth = -1;

        for (String superclassId : commonSuperclasses) {
            int depth = getDepth(superclassId);
            if (depth > maxDepth) {
                maxDepth = depth;
                lcs = superclassId;
            }
        }

        return lcs;
    }

    /**
     * 获取概念在继承树中的深度
     * 
     * @param conceptId 概念ID
     * @return 深度值
     */
    private int getDepth(String conceptId) {
        Set<String> superclasses = getAllSuperclasses(conceptId);
        return superclasses.size();
    }

    /**
     * 使缓存失效
     */
    private void invalidateCaches() {
        subclassCache.clear();
        superclassCache.clear();
    }

    /**
     * 获取概念数量
     * 
     * @return 概念数量
     */
    public int getConceptCount() {
        return conceptCache.size();
    }

    /**
     * 清空缓存
     */
    public void clearCache() {
        conceptCache.clear();
        invalidateCaches();
    }
}