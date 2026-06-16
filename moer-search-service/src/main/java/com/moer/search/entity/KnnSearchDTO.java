package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@ApiModel
public class KnnSearchDTO implements Serializable {


    /**
     * field : product-vector
     * query_vector : [230,300.33,-34.8988,15.555,-200]
     * k : 5
     * num_candidates : 50
     * filter : {"query_string":{"default_field":"price","query":"1599"}}
     */

    @ApiModelProperty("字段")
    @JsonProperty("field")
    private String field;

    @ApiModelProperty("top k")
    @JsonProperty("k")
    private Integer k;

    @ApiModelProperty("numCandidates")
    @JsonProperty("numCandidates")
    private Integer numCandidates;

    @ApiModelProperty("boost")
    @JsonProperty("boost")
    private Float boost;

    @JsonProperty("filter")
    private FilterDTO filter;

    @ApiModelProperty("向量值")
    @JsonProperty("queryVector")
    private List<Double> queryVector;

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    public static class FilterDTO implements Serializable {
        /**
         * query_string : {"default_field":"price","query":"1599"}
         */

        @ApiModelProperty("queryString")
        @JsonProperty("queryString")
        private QueryStringDTO queryString;

    }
}
