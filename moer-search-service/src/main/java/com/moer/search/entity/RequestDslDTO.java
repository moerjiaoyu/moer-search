package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@Data
public class RequestDslDTO implements Serializable {

    /**
     *
     */
    @ApiModelProperty(name = "Dsl信息")
    @JsonProperty("dslStr")
    private String dslStr;
}
