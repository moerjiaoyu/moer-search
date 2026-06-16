package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@ApiModel("基础分页对象【最大可查前一万条数据(页数*每页条数不可大于一万条)】")
public class PageInfoDTO implements Serializable {


    /**
     * currentPage : 1
     * pageSize : 10
     */

    @JsonProperty("currentPage")
    @ApiModelProperty("当前页【默认第一页】")
    private Integer currentPage;


    @JsonProperty("pageSize")
    @ApiModelProperty("每页条数【默认每页10条,最大500条】")
    private Integer pageSize = 10;
}
