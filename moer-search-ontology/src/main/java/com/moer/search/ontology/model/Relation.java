package com.moer.search.ontology.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 关系模型类
 * 
 * 表示本体中概念之间的关系，支持多种预定义的关系类型。
 * 
 * <p>关系是本体中连接概念的桥梁，用于表达概念之间的语义关联。
 * 
 * @author moer
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Relation {

    /** 关系唯一标识符 */
    private String relationId;

    /** 源概念ID */
    private String sourceConceptId;

    /** 目标概念ID */
    private String targetConceptId;

    /** 关系类型 */
    private String relationType;

    /** 关系名称 */
    private String relationName;

    /** 关系描述 */
    private String description;

    /** 关系权重 */
    private Integer weight;

    /** 反向关系ID */
    private String inverseRelationId;

    /** 是否对称关系 */
    private Boolean isSymmetric;

    /** 是否传递关系 */
    private Boolean isTransitive;

    /** 是否自反关系 */
    private Boolean isReflexive;

    /** 创建时间戳 */
    private Long createTime;

    /** 更新时间戳 */
    private Long updateTime;

    /** 继承关系 */
    public static final String TYPE_IS_A = "is_a";
    
    /** 部分关系 */
    public static final String TYPE_PART_OF = "part_of";
    
    /** 拥有关系 */
    public static final String TYPE_HAS_A = "has_a";
    
    /** 实例关系 */
    public static final String TYPE_INSTANCE_OF = "instance_of";
    
    /** 相关关系 */
    public static final String TYPE_RELATED_TO = "related_to";
    
    /** 因果关系 */
    public static final String TYPE_CAUSES = "causes";
    
    /** 治疗关系 */
    public static final String TYPE_TREATMENT_FOR = "treatment_for";
    
    /** 位置关系 */
    public static final String TYPE_LOCATED_IN = "located_in";
    
    /** 包含关系 */
    public static final String TYPE_CONTAINS = "contains";
    
    /** 产生关系 */
    public static final String TYPE_PRODUCES = "produces";
    
    /** 用途关系 */
    public static final String TYPE_USED_FOR = "used_for";

    /**
     * 判断是否为某关系的反向关系
     * 
     * @param other 另一关系对象
     * @return 如果是反向关系返回true
     */
    public boolean isInverseOf(Relation other) {
        return this.inverseRelationId != null && this.inverseRelationId.equals(other.getRelationId());
    }

    /**
     * 判断关系类型是否有效
     * 
     * @return 如果是预定义的有效关系类型返回true
     */
    public boolean isValidRelationType() {
        if (relationType == null) {
            return false;
        }
        switch (relationType) {
            case TYPE_IS_A:
            case TYPE_PART_OF:
            case TYPE_HAS_A:
            case TYPE_INSTANCE_OF:
            case TYPE_RELATED_TO:
            case TYPE_CAUSES:
            case TYPE_TREATMENT_FOR:
            case TYPE_LOCATED_IN:
            case TYPE_CONTAINS:
            case TYPE_PRODUCES:
            case TYPE_USED_FOR:
                return true;
            default:
                return false;
        }
    }
}