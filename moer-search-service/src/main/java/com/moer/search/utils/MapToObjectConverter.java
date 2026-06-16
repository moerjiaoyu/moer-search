package com.moer.search.utils;

import java.lang.reflect.Field;
import java.util.Map;

public class MapToObjectConverter {
    public static <T> T convert(Map<String, Object> map, Class<T> clazz)
            throws IllegalAccessException, InstantiationException {
        T object = clazz.newInstance();
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            field.set(object, map.get(field.getName()));
        }
        return object;
    }
}
