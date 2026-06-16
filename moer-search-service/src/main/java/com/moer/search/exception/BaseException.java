package com.moer.search.exception;

import com.moer.search.enums.IResponseEnum;
import lombok.Getter;

@Getter
public class BaseException extends RuntimeException {

    /**
     * 返回码
     */
    protected IResponseEnum responseEnum;

    protected String code;
    protected String msg;
    /**
     * 异常消息占位参数
     */
    protected Object[] args;

    public BaseException(IResponseEnum responseEnum) {
        super(responseEnum.getMessage());
        this.responseEnum = responseEnum;
    }

    public BaseException(IResponseEnum responseEnum, Object[] args) {
        super(responseEnum.getMessage());
        this.responseEnum = responseEnum;
        this.args = args;
    }

    public BaseException(IResponseEnum responseEnum, Object[] args, String message) {
        super(message);
        this.responseEnum = responseEnum;
        this.args = args;
    }

    public BaseException(IResponseEnum responseEnum, Object[] args, String message, Throwable cause) {
        super(message, cause);
        this.responseEnum = responseEnum;
        this.args = args;
    }

    public BaseException(IResponseEnum responseEnum, Throwable cause) {
        super(responseEnum.getMessage(), cause);
        this.responseEnum = responseEnum;
    }
}
