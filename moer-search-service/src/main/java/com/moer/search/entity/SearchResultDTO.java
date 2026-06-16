package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Data
@ApiModel
@JsonIgnoreProperties(ignoreUnknown = true)
public class SearchResultDTO<T> implements Serializable {

    @ApiModelProperty("数据结果")
    private List<T> list;
    @ApiModelProperty("总条数")
    private long totalSize;
    /**
     * 返回聚合结构
     */
    @ApiModelProperty("聚合结果")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Map<String, Map<String, Object>> aggregations;
}
