package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@ApiModel
public class AggItemDTO implements Serializable {


    /**
     * field : aggField
     * type : aggType
     * size : 10
     * date_histogram : {"field":"date","calendar_interval":"month"}
     */

    /**
     * 聚合的字段
     */
    @JsonProperty("field")
    @ApiModelProperty("聚合的字段")
    private String field;
    /**
     * 聚合类型
     * terms：类似于sql中的 group by
     * date_histogram：时间聚合。
     * avg：平均值
     * max：最大值
     * min：最小值
     * sum：总值
     */
    @JsonProperty("type")
    @ApiModelProperty("聚合类型")
    private String type;

    /**
     * size
     */
    @ApiModelProperty("size")
    @JsonProperty("size")
    private Integer size = 10;

    @ApiModelProperty("时间聚合")
    @JsonProperty("dateHistogram")
    private DateHistogramDTO dateHistogram;

    @JsonIgnoreProperties(ignoreUnknown = true)
    @Data
    @ApiModel("时间聚合")
    public static class DateHistogramDTO implements Serializable {
        /**
         * field : date
         * calendar_interval : month
         */

        @ApiModelProperty("时间聚合字段")
        @JsonProperty("field")
        private String field;

        @ApiModelProperty("时间范围 取值有，minute，hour，day，week，month，quarter，year")
        @JsonProperty("calendarInterval")
        private String calendarInterval;
    }
}
