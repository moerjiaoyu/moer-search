package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import lombok.Data;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * 批量文档操作请求实体
 * 
 * <p>用于封装批量文档操作（批量保存、批量更新）的请求数据。
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@ApiModel(description = "批量文档操作请求实体")
public class BatchDocument implements Serializable {

    /**
     * 文档数据列表
     */
    @JsonProperty("data")
    private List<DataDTO> data;

    /**
     * 单条文档数据实体
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    public static class DataDTO implements Serializable {

        /**
         * 索引名称
         */
        @JsonProperty("index")
        private String index;

        /**
         * 文档ID
         */
        @JsonProperty("id")
        private String id;

        /**
         * 路由值（用于路由分片）
         */
        @JsonProperty("routing")
        private String routing;

        /**
         * 文档内容（JSON对象）
         */
        @JsonProperty("obj")
        private Map<String, Object> obj;
    }
}
