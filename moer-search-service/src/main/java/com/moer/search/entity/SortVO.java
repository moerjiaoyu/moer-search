package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@Data
@ApiModel
public class SortVO implements Serializable {

    /**
     * 排序字段
     */
    @ApiModelProperty("排序字段")
    @JsonProperty("sortField")
    private String sortField;

    /**
     * 排序方式 desc或者asc 默认正序
     */
    @ApiModelProperty("排序方式 desc或者asc")
    @JsonProperty("sortWay")
    private String sortWay = "asc";
}
