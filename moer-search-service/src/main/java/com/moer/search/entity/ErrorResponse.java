package com.moer.search.entity;

import com.alibaba.fastjson2.annotation.JSONField;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.moer.search.enums.ResponseEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Accessors(chain = true)
@Builder
@AllArgsConstructor
public class ErrorResponse implements Serializable {

    /**
     * 响应码
     */
    private String code;

    /**
     * 是否成功
     */
    private Boolean success;

    /**
     * 响应消息
     */
    private String message;

    /**
     * 错误信息集合
     */
    private List<String> errors;

    /**
     * 响应时间
     */
    @JSONField(format = "yyyy-MM-dd HH:mm:ss")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime time;

    public static ErrorResponse result() {
        return result(ResponseEnum.SERVER_ERROR);
    }

    public static ErrorResponse result(ResponseEnum responseEnum) {
        return result(responseEnum, null);
    }

    public static ErrorResponse result(String code, String message) {
        return result(code, message, null);
    }

    public static ErrorResponse result(ResponseEnum responseEnum, List<String> errors) {
        return result(responseEnum.getCode(), responseEnum.getMessage(), errors);
    }

    public static ErrorResponse result(String code, String message, List<String> errors) {
        boolean success = false;
        if (code.equals(ResponseEnum.OK.getCode())) {
            success = true;
        }
        return ErrorResponse.builder()
                .code(code)
                .message(message)
                .success(success)
                .time(LocalDateTime.now())
                .errors(errors)
                .build();
    }
}
