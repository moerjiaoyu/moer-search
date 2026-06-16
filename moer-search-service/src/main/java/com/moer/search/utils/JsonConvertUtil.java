package com.moer.search.utils;


import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;

/**
 * Json和Object的互相转换
 *
 */
@Slf4j
public class JsonConvertUtil {

    private JsonConvertUtil() {
    }

    /**
     * JSON 转 Object
     */
    public static <T> T jsonToObject(String pojo, Class<T> clazz) {
        return JSONObject.parseObject(pojo, clazz);
    }

    /**
     * Object 转 JSON
     */
    public static <T> String obj2String(T t) {
        return JSONObject.toJSONString(t);
    }
}
