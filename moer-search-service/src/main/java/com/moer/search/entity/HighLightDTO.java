package com.moer.search.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 高亮
 */
@Data
@ApiModel
public class HighLightDTO implements Serializable{
    /**
     * 前置标签
     */
    @ApiModelProperty("前置标签")
    private String preTag = "<em>";
    /**
     * 后置标签
     */
    @ApiModelProperty("后置标签")
    private String postTag = "</em>";

    @ApiModelProperty("高亮字段")
    private List<HighLightFieldsDTO> fields = new ArrayList<>();

    @ApiModelProperty("高亮order字段 默认值为score")
    private String order = "score";

    @ApiModelProperty("指定每个高亮字段中要显示的最大片段数 默认为5")
    private Integer numberOfFragments = 5;

    @ApiModelProperty("如果在高亮字段中没有匹配项，则设置片段的大小。默认为 0，表示如果没有匹配项，则不会显示任何片段")
    private Integer noMatchSize = 0;

    @ApiModelProperty("指定用于生成高亮片段的边界扫描的语言环境 默认中文")
    private String boundaryScannerLocale = "zh_CN";
    @ApiModelProperty("生成高亮片段的边界扫描类型 word、chars、sentence")
    private String boundaryScanner = "word";

    @Data
    @ApiModel
    public static class HighLightFieldsDTO implements Serializable {

        @ApiModelProperty("字段名称")
        private String field;

        @ApiModelProperty("指定高亮数据展示多少个字符回来 默认20")
        private Integer fragmentSize = 20;

        @ApiModelProperty("指定每个高亮字段中要显示的最大片段数 默认为5")
        private Integer numberOfFragments = 5;

        @ApiModelProperty("如果在高亮字段中没有匹配项，则设置片段的大小。默认为 0，表示如果没有匹配项，则不会显示任何片段")
        private Integer noMatchSize = 0;
    }

}
