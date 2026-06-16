package com.moer.search.utils;

import org.yaml.snakeyaml.Yaml;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;

/**
 * @author moer
 */
public class YamlToProperties {

    public static void main(String[] args) {
        Yaml yaml = new Yaml();
        String filePath = "file/yaml/bootstrap.yml";
        try (InputStream inputStream = new FileInputStream(filePath)) {
            Object object = yaml.load(inputStream);
            List<String> resultList = travelRootWithResult(object);
            System.out.println(resultList);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static List<String> travelRootWithResult(Object object) {
        List<String> resultList = new ArrayList<>();
        if (object instanceof LinkedHashMap) {
            LinkedHashMap map = (LinkedHashMap) object;
            Set<Object> keySet = map.keySet();
            for (Object key : keySet) {
                List<String> keyList = new ArrayList<>();
                keyList.add((String) key);
                travelTreeNode(map.get(key), keyList, resultList);
            }
        }
        return resultList;
    }


    public static void travelTreeNode(Object obj, List<String> keyList, List<String> resultList) {
        if (obj instanceof LinkedHashMap) {
            LinkedHashMap linkedHashMap = (LinkedHashMap) obj;
            linkedHashMap.forEach((key, value) -> {
                if (value instanceof LinkedHashMap) {
                    keyList.add((String) key);
                    travelTreeNode(value, keyList, resultList);
                    keyList.remove(keyList.size() - 1);
                } else {
                    StringBuilder result = new StringBuilder();
                    for (String strKey : keyList) {
                        result.append(strKey).append(".");
                    }
                    result.append(key).append("=").append(value);
                    resultList.add(result.toString());
                }
            });
        } else {
            StringBuilder result = new StringBuilder();
            result.append(keyList.get(0)).append("=").append(obj);
            resultList.add(result.toString());
        }
    }
}
