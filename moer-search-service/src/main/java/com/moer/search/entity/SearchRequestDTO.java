package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@NoArgsConstructor
@Data
@ApiModel
@JsonIgnoreProperties(ignoreUnknown = true)
public class SearchRequestDTO implements Serializable {
    /**
     * 聚合字段
     */
    @ApiModelProperty(name = "聚合字段")
    @JsonProperty("agg")
    private List<AggItemDTO> agg;

    /**
     * knn向量检索字段
     */
    @ApiModelProperty(name = "knn向量检索字段")
    @JsonProperty("knn")
    private List<KnnSearchDTO> knn;

    /**
     * 检索参数
     */
    @JsonProperty("queryString")
    private QueryStringDTO queryString;


    @JsonProperty("pageInfo")
    private PageInfoDTO pageInfo;

    /**
     * 排序参数
     */
    @JsonProperty("sortInfoList")
    private List<SortVO> sortInfoList;

    /**
     * 折叠，将召回的结果，进行去重处理，这里只能是一个字段。根据某个字段排重。这里是可选参数，如果带此参数，则会执行排重操作，如果不需要，则不要构造此参数。
     */
    @ApiModelProperty("折叠，将召回的结果，进行去重处理，这里只能是一个字段")
    @JsonProperty("collapseField")
    private String collapseField;

    /**
     * 高亮
     */
    @ApiModelProperty("高亮")
    @JsonProperty("highlights")
    private HighLightDTO highlights;
    /**
     * 需要返回的字段 为空，全部返回
     */
    @ApiModelProperty("需要返回的字段 为空，全部返回")
    @JsonProperty("fields")
    private List<String> fields;
}
