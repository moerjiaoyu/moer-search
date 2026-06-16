package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@Data
public class QueryStringDTO implements Serializable {


    /**
     * query : 中国
     * fields : ["content","title"]
     * type : phrase
     * default_operator : and
     */

    /**
     * query string 检索字符串
     */
    @JsonProperty("query")
    private String query;
    /**
     * type 说明
     * best_fields（默认）_score查找与任何字段匹配的文档并使用任何匹配字段中的 最高值 。看 best_fields。
     * bool_prefix在每个字段上创建match_bool_prefix查询并组合_score每个字段的查询。看bool_prefix。
     * cross_fields将田地视为analyzer一大片田地。查找任何字段中的每个单词。看cross_fields。
     * most_fields查找与任何字段匹配的文档并合并_score每个字段的文档。看most_fields。
     * phrase match_phrase对每个字段 运行查询并使用_score最佳字段中的查询。参见phrase和phrase_prefix。
     * phrase_prefix match_phrase_prefix对每个字段 运行查询并使用_score最佳字段中的查询。参见phrase和phrase_prefix。
     */
    @ApiModelProperty("类型 best_fields、bool_prefix、cross_fields、most_fields、phrase、match_phrase、phrase_prefix、match_phrase_prefix")
    @JsonProperty("type")
    private String type;
    /**
     * 默认操作符 如and或or
     */
    @ApiModelProperty("默认操作符 如and或or")
    @JsonProperty("defaultOperator")
    private String defaultOperator;
    /**
     * 字段列表
     */
    @ApiModelProperty("需要返回字段列表")
    @JsonProperty("fields")
    private List<String> fields;
}
