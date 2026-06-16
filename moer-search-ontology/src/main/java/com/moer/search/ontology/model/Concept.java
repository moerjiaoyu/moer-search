package com.moer.search.ontology.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 概念模型类
 * 
 * 表示本体中的概念实体，包含概念的基本信息、层级关系、关系和属性。
 * 
 * <p>概念是本体的基本组成单元，用于表示领域知识中的实体、属性、事件等抽象概念。
 * 
 * @author moer
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Concept {

    /** 概念唯一标识符 */
    private String conceptId;

    /** 概念中文名称 */
    private String conceptName;

    /** 概念英文名称 */
    private String conceptNameEn;

    /** 概念描述 */
    private String description;

    /** 父概念ID列表 */
    @Builder.Default
    private List<String> parents = new ArrayList<>();

    /** 子概念ID列表 */
    @Builder.Default
    private List<String> children = new ArrayList<>();

    /** 关系列表 */
    @Builder.Default
    private List<Relation> relations = new ArrayList<>();

    /** 语义类型 */
    private String semanticType;

    /** 所属领域 */
    private String domain;

    /** 创建时间戳 */
    private Long createTime;

    /** 更新时间戳 */
    private Long updateTime;

    /** 是否为抽象概念 */
    private Boolean isAbstract;

    /** 同义词列表 */
    @Builder.Default
    private List<String> synonyms = new ArrayList<>();

    /** 属性列表 */
    @Builder.Default
    private List<String> attributes = new ArrayList<>();

    /**
     * 添加父概念
     * 
     * @param parentId 父概念ID
     */
    public void addParent(String parentId) {
        if (parents == null) {
            parents = new ArrayList<>();
        }
        if (!parents.contains(parentId)) {
            parents.add(parentId);
        }
    }

    /**
     * 添加子概念
     * 
     * @param childId 子概念ID
     */
    public void addChild(String childId) {
        if (children == null) {
            children = new ArrayList<>();
        }
        if (!children.contains(childId)) {
            children.add(childId);
        }
    }

    /**
     * 添加关系
     * 
     * @param relation 关系对象
     */
    public void addRelation(Relation relation) {
        if (relations == null) {
            relations = new ArrayList<>();
        }
        relations.add(relation);
    }

    /**
     * 添加同义词
     * 
     * @param synonym 同义词
     */
    public void addSynonym(String synonym) {
        if (synonyms == null) {
            synonyms = new ArrayList<>();
        }
        if (!synonyms.contains(synonym)) {
            synonyms.add(synonym);
        }
    }

    /**
     * 添加属性
     * 
     * @param attribute 属性名称
     */
    public void addAttribute(String attribute) {
        if (attributes == null) {
            attributes = new ArrayList<>();
        }
        if (!attributes.contains(attribute)) {
            attributes.add(attribute);
        }
    }
}