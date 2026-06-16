package com.moer.search.ontology.index;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Elasticsearch客户端封装类
 * 
 * 提供Elasticsearch REST API的基础封装，支持索引管理、生命周期策略管理和别名管理。
 * 支持基本认证，兼容Java 8环境。
 * 
 * <p>主要功能：
 * <ul>
 *   <li>索引管理 - 创建、删除、检查索引是否存在</li>
 *   <li>模板管理 - 创建、更新索引模板</li>
 *   <li>生命周期管理 - 创建、更新、检查生命周期策略</li>
 *   <li>别名管理 - 添加、移除索引别名</li>
 *   <li>连接测试 - 检查Elasticsearch服务是否可用</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Component
public class ElasticsearchClientWrapper {

    /** Elasticsearch服务端点地址 */
    @Value("${spring.elasticsearch.rest.uris:http://localhost:9200}")
    private String esEndpoint;

    /** Elasticsearch用户名（可选） */
    @Value("${spring.elasticsearch.rest.username:}")
    private String esUsername;

    /** Elasticsearch密码（可选） */
    @Value("${spring.elasticsearch.rest.password:}")
    private String esPassword;

    /**
     * 初始化方法
     * 
     * 在Spring容器启动时执行，记录端点配置信息。
     */
    @PostConstruct
    public void init() {
        log.info("ElasticsearchClientWrapper initialized with endpoint: {}", esEndpoint);
    }

    /**
     * 检查索引是否存在
     * 
     * @param indexName 索引名称
     * @return 如果索引存在返回true，否则返回false
     */
    public boolean indexExists(String indexName) {
        try {
            URL url = new URL(esEndpoint + "/" + indexName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            applyAuth(conn);
            
            int responseCode = conn.getResponseCode();
            return responseCode == 200;
        } catch (Exception e) {
            log.warn("Failed to check if index '{}' exists: {}", indexName, e.getMessage());
            return false;
        }
    }

    /**
     * 创建索引
     * 
     * @param indexName 索引名称
     * @param settings 索引设置（可选）
     * @param mappings 索引映射（可选）
     * @return 创建成功返回true，否则返回false
     */
    public boolean createIndex(String indexName, Map<String, Object> settings, Map<String, Object> mappings) {
        try {
            URL url = new URL(esEndpoint + "/" + indexName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PUT");
            conn.setRequestProperty("Content-Type", "application/json");
            applyAuth(conn);
            conn.setDoOutput(true);

            Map<String, Object> requestBody = new java.util.HashMap<>();
            if (settings != null && !settings.isEmpty()) {
                requestBody.put("settings", settings);
            }
            if (mappings != null && !mappings.isEmpty()) {
                requestBody.put("mappings", mappings);
            }

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = com.alibaba.fastjson2.JSON.toJSONString(requestBody).getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200 || responseCode == 201) {
                log.info("Index '{}' created successfully", indexName);
                return true;
            } else {
                String errorMessage = readResponse(conn);
                log.error("Failed to create index '{}': HTTP {} - {}", indexName, responseCode, errorMessage);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to create index '{}': {}", indexName, e.getMessage());
            return false;
        }
    }

    /**
     * 删除索引
     * 
     * @param indexName 索引名称
     * @return 删除成功返回true，否则返回false
     */
    public boolean deleteIndex(String indexName) {
        try {
            URL url = new URL(esEndpoint + "/" + indexName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("DELETE");
            applyAuth(conn);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                return true;
            } else if (responseCode == 404) {
                log.warn("Index '{}' not found, nothing to delete", indexName);
                return true;
            } else {
                String errorMessage = readResponse(conn);
                log.error("Failed to delete index '{}': HTTP {} - {}", indexName, responseCode, errorMessage);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to delete index '{}': {}", indexName, e.getMessage());
            return false;
        }
    }

    /**
     * 检查生命周期策略是否存在
     * 
     * @param policyName 策略名称
     * @return 如果策略存在返回true，否则返回false
     */
    public boolean lifecyclePolicyExists(String policyName) {
        try {
            URL url = new URL(esEndpoint + "/_ilm/policy/" + policyName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            applyAuth(conn);

            int responseCode = conn.getResponseCode();
            return responseCode == 200;
        } catch (Exception e) {
            log.warn("Failed to check if lifecycle policy '{}' exists: {}", policyName, e.getMessage());
            return false;
        }
    }

    /**
     * 创建或更新生命周期策略
     * 
     * @param policyName 策略名称
     * @param policyJson 策略JSON配置
     * @return 创建/更新成功返回true，否则返回false
     */
    public boolean createLifecyclePolicy(String policyName, String policyJson) {
        try {
            URL url = new URL(esEndpoint + "/_ilm/policy/" + policyName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PUT");
            conn.setRequestProperty("Content-Type", "application/json");
            applyAuth(conn);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = policyJson.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200 || responseCode == 201) {
                return true;
            } else {
                String errorMessage = readResponse(conn);
                log.error("Failed to create lifecycle policy '{}': HTTP {} - {}", policyName, responseCode, errorMessage);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to create lifecycle policy '{}': {}", policyName, e.getMessage());
            return false;
        }
    }

    /**
     * 更新生命周期策略
     * 
     * @param policyName 策略名称
     * @param policyJson 策略JSON配置
     * @return 更新成功返回true，否则返回false
     */
    public boolean updateLifecyclePolicy(String policyName, String policyJson) {
        return createLifecyclePolicy(policyName, policyJson);
    }

    /**
     * 创建或更新索引模板
     * 
     * @param templateName 模板名称
     * @param templateJson 模板JSON配置
     * @return 创建/更新成功返回true，否则返回false
     */
    public boolean createIndexTemplate(String templateName, String templateJson) {
        try {
            URL url = new URL(esEndpoint + "/_template/" + templateName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PUT");
            conn.setRequestProperty("Content-Type", "application/json");
            applyAuth(conn);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = templateJson.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200 || responseCode == 201) {
                log.info("Index template '{}' created/updated successfully", templateName);
                return true;
            } else {
                String errorMessage = readResponse(conn);
                log.error("Failed to create index template '{}': HTTP {} - {}", templateName, responseCode, errorMessage);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to create index template '{}': {}", templateName, e.getMessage());
            return false;
        }
    }

    /**
     * 检查索引模板是否存在
     * 
     * @param templateName 模板名称
     * @return 如果模板存在返回true，否则返回false
     */
    public boolean indexTemplateExists(String templateName) {
        try {
            URL url = new URL(esEndpoint + "/_template/" + templateName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("HEAD");
            applyAuth(conn);

            int responseCode = conn.getResponseCode();
            return responseCode == 200;
        } catch (Exception e) {
            log.warn("Failed to check if index template '{}' exists: {}", templateName, e.getMessage());
            return false;
        }
    }

    /**
     * 删除索引模板
     * 
     * @param templateName 模板名称
     * @return 删除成功返回true，否则返回false
     */
    public boolean deleteIndexTemplate(String templateName) {
        try {
            URL url = new URL(esEndpoint + "/_template/" + templateName);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("DELETE");
            applyAuth(conn);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                log.info("Index template '{}' deleted successfully", templateName);
                return true;
            } else if (responseCode == 404) {
                log.warn("Index template '{}' not found, nothing to delete", templateName);
                return true;
            } else {
                String errorMessage = readResponse(conn);
                log.error("Failed to delete index template '{}': HTTP {} - {}", templateName, responseCode, errorMessage);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to delete index template '{}': {}", templateName, e.getMessage());
            return false;
        }
    }

    /**
     * 为索引添加别名
     * 
     * @param indexName 索引名称
     * @param aliasName 别名名称
     * @return 添加成功返回true，否则返回false
     */
    public boolean createAlias(String indexName, String aliasName) {
        try {
            URL url = new URL(esEndpoint + "/_aliases");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            applyAuth(conn);
            conn.setDoOutput(true);

            Map<String, Object> requestBody = new java.util.HashMap<>();
            Map<String, Object> action = new java.util.HashMap<>();
            Map<String, Object> add = new java.util.HashMap<>();
            add.put("index", indexName);
            add.put("alias", aliasName);
            action.put("add", add);
            
            java.util.List<Map<String, Object>> actions = new java.util.ArrayList<>();
            actions.add(action);
            requestBody.put("actions", actions);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = com.alibaba.fastjson2.JSON.toJSONString(requestBody).getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                log.info("Alias '{}' added to index '{}'", aliasName, indexName);
                return true;
            } else {
                String errorMessage = readResponse(conn);
                log.error("Failed to add alias '{}' to index '{}': HTTP {} - {}", aliasName, indexName, responseCode, errorMessage);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to add alias '{}' to index '{}': {}", aliasName, indexName, e.getMessage());
            return false;
        }
    }

    /**
     * 从索引移除别名
     * 
     * @param indexName 索引名称
     * @param aliasName 别名名称
     * @return 移除成功返回true，否则返回false
     */
    public boolean removeAlias(String indexName, String aliasName) {
        try {
            URL url = new URL(esEndpoint + "/_aliases");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            applyAuth(conn);
            conn.setDoOutput(true);

            Map<String, Object> requestBody = new java.util.HashMap<>();
            Map<String, Object> action = new java.util.HashMap<>();
            Map<String, Object> remove = new java.util.HashMap<>();
            remove.put("index", indexName);
            remove.put("alias", aliasName);
            action.put("remove", remove);
            
            java.util.List<Map<String, Object>> actions = new java.util.ArrayList<>();
            actions.add(action);
            requestBody.put("actions", actions);

            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = com.alibaba.fastjson2.JSON.toJSONString(requestBody).getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                log.info("Alias '{}' removed from index '{}'", aliasName, indexName);
                return true;
            } else {
                String errorMessage = readResponse(conn);
                log.error("Failed to remove alias '{}' from index '{}': HTTP {} - {}", aliasName, indexName, responseCode, errorMessage);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to remove alias '{}' from index '{}': {}", aliasName, indexName, e.getMessage());
            return false;
        }
    }

    /**
     * 检查Elasticsearch服务是否可达
     * 
     * @return 如果服务可达返回true，否则返回false
     */
    public boolean ping() {
        try {
            URL url = new URL(esEndpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            applyAuth(conn);

            int responseCode = conn.getResponseCode();
            return responseCode == 200;
        } catch (Exception e) {
            log.warn("Elasticsearch ping failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 应用HTTP基本认证
     * 
     * 如果配置了用户名和密码，则在请求头中添加Basic认证信息。
     * 
     * @param conn HTTP连接对象
     */
    private void applyAuth(HttpURLConnection conn) {
        if (esUsername != null && !esUsername.isEmpty()) {
            String auth = esUsername + ":" + (esPassword != null ? esPassword : "");
            String encodedAuth = java.util.Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            conn.setRequestProperty("Authorization", "Basic " + encodedAuth);
        }
    }

    /**
     * 读取HTTP响应内容
     * 
     * @param conn HTTP连接对象
     * @return 响应内容字符串，如果读取失败返回null
     */
    private String readResponse(HttpURLConnection conn) {
        try {
            InputStream is = conn.getErrorStream();
            if (is == null) {
                is = conn.getInputStream();
            }
            if (is != null) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                return sb.toString();
            }
        } catch (IOException e) {
            log.debug("Failed to read response: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 获取Elasticsearch服务端点
     * 
     * @return 端点地址
     */
    public String getEsEndpoint() {
        return esEndpoint;
    }
}