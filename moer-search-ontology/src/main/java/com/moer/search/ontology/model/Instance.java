package com.moer.search.ontology.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 实例模型类
 * 
 * 表示本体概念的具体实例，包含实例的属性和语义标签。
 * 
 * <p>实例是概念的具体化，代表领域知识中的具体对象或实体。
 * 
 * @author moer
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Instance {

    /** 实例唯一标识符 */
    private String instanceId;

    /** 实例名称 */
    private String instanceName;

    /** 所属概念ID */
    private String conceptId;

    /** 所属概念名称 */
    private String conceptName;

    /** 属性键值对 */
    @Builder.Default
    private Map<String, Object> properties = new HashMap<>();

    /** 概念标签列表 */
    @Builder.Default
    private List<String> conceptTags = new ArrayList<>();

    /** 语义类型列表 */
    @Builder.Default
    private List<String> semanticTypes = new ArrayList<>();

    /** 关联文档ID */
    private String documentId;

    /** 创建时间戳 */
    private Long createTime;

    /** 更新时间戳 */
    private Long updateTime;

    /** 是否活跃 */
    private Boolean isActive;

    /**
     * 添加属性
     * 
     * @param key 属性键
     * @param value 属性值
     */
    public void addProperty(String key, Object value) {
        if (properties == null) {
            properties = new HashMap<>();
        }
        properties.put(key, value);
    }

    /**
     * 获取属性值
     * 
     * @param key 属性键
     * @return 属性值，如果不存在返回null
     */
    public Object getProperty(String key) {
        return properties != null ? properties.get(key) : null;
    }

    /**
     * 添加概念标签
     * 
     * @param tag 标签名称
     */
    public void addConceptTag(String tag) {
        if (conceptTags == null) {
            conceptTags = new ArrayList<>();
        }
        if (!conceptTags.contains(tag)) {
            conceptTags.add(tag);
        }
    }

    /**
     * 添加语义类型
     * 
     * @param type 语义类型名称
     */
    public void addSemanticType(String type) {
        if (semanticTypes == null) {
            semanticTypes = new ArrayList<>();
        }
        if (!semanticTypes.contains(type)) {
            semanticTypes.add(type);
        }
    }

    /**
     * 判断是否包含指定属性
     * 
     * @param key 属性键
     * @return 如果包含该属性返回true
     */
    public boolean hasProperty(String key) {
        return properties != null && properties.containsKey(key);
    }

    /**
     * 移除属性
     * 
     * @param key 属性键
     */
    public void removeProperty(String key) {
        if (properties != null) {
            properties.remove(key);
        }
    }
}