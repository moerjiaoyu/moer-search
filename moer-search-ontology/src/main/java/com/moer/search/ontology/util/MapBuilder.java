package com.moer.search.ontology.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Map 构建工具类
 * 
 * 提供便捷的 Map 创建方法，兼容 Java 8。
 * 
 * @author moer
 * @version 1.0.0
 */
public final class MapBuilder {

    private MapBuilder() {
    }

    public static Map<String, Object> of(Object... keyValues) {
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            String key = String.valueOf(keyValues[i]);
            Object value = keyValues[i + 1];
            map.put(key, value);
        }
        return map;
    }
}