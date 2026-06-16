package com.moer.search.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.moer.search.enums.ResponseEnum;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * 统一响应结果封装类
 * 
 * <p>用于封装 API 接口的响应结果，提供统一的响应格式。
 * 支持泛型数据返回，包含响应状态码、响应消息、时间戳和响应数据。
 * 
 * <p>响应格式：
 * <pre>
 * {
 *   "code": "200",
 *   "msg": "处理成功",
 *   "time": "2024-01-01T12:00:00Z",
 *   "data": {...}
 * }
 * </pre>
 * 
 * <p>提供的静态工厂方法：
 * <ul>
 *   <li>{@link #success(Object)} - 创建成功响应并携带数据</li>
 *   <li>{@link #success()} - 创建成功响应（无数据）</li>
 *   <li>{@link #fail(String, Object)} - 创建失败响应</li>
 *   <li>{@link #warn(String)} - 创建警告响应</li>
 * </ul>
 * 
 * @param <T> 响应数据的泛型类型
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RestResult<T> implements Serializable {
    public static final String SUCCESSFUL_CODE = "200";
    public static final String SUCCESSFUL_MESG = "处理成功";
    public static final String FAILED_MESG = "服务器异常";

    /**
     * 处理结果code
     */
    @ApiModelProperty("处理结果code")
    private String code;
    /**
     * 处理结果描述信息
     */
    @ApiModelProperty("处理结果描述信息")
    private String msg;
    /**
     * 请求结果生成时间戳
     */
    @ApiModelProperty("请求结果生成时间戳")
    private Instant time;
    /**
     * 处理结果数据信息
     */
    @ApiModelProperty("处理结果数据信息")
//    @JsonInclude(JsonInclude.Include.NON_NULL)
    private T data;

    /**
     * @param errorType
     */
    public RestResult(ResponseEnum errorType) {
        this.code = errorType.getCode();
        this.msg = errorType.getMessage();
        ZoneId timeZone = ZoneId.of("Asia/Shanghai");
        ZonedDateTime now = ZonedDateTime.now(timeZone);
        this.time = now.toInstant();
    }

    /**
     * @param errorType
     * @param data
     */
    public RestResult(ResponseEnum errorType, T data) {
        this(errorType);
        this.data = data;
    }

    /**
     * 内部使用，用于构造成功的结果
     *
     * @param code
     * @param msg
     * @param data
     */
    public RestResult(String code, String msg, T data) {
        this.code = code;
        this.msg = msg;
        this.data = data;
        this.time = ZonedDateTime.now().toInstant();
    }

    /**
     * 快速创建成功结果并返回结果数据
     *
     * @param data
     * @return Result
     */
    public static RestResult success(Object data) {
        return new RestResult<>(SUCCESSFUL_CODE, SUCCESSFUL_MESG, data);
    }

    /**
     * 快速创建成功结果
     *
     * @return Result
     */
    public static RestResult success() {
        return success(null);
    }

    /**
     * 系统异常类并返回结果数据
     *
     * @param msg  异常信息
     * @param data 异常数据(可以存放堆栈信息等)
     * @return Result
     */
    public static RestResult fail(String msg, Object data) {
        return new RestResult<>("-1", msg, data);
    }

    /**
     * 系统异常并返回结果数据
     *
     * @param mesg 异常信息
     * @return Result
     */
    public static RestResult warn(String mesg) {
        return new RestResult<>("-2", mesg, mesg);
    }


    /**
     * 成功code=000000
     *
     * @return true/false
     */
    @JsonIgnore
    public boolean isSuccess() {
        return SUCCESSFUL_CODE.equals(this.code);
    }

    /**
     * 失败
     *
     * @return true/false
     */
    @JsonIgnore
    public boolean isFail() {
        return !isSuccess();
    }

    public static <T> T getData(RestResult<T> result) {
        if (result.isSuccess()) {
            return result.getData();
        }
        return null;
    }

}
