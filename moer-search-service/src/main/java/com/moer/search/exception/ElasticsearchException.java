package com.moer.search.exception;

import com.moer.search.enums.IResponseEnum;

public class ElasticsearchException extends BaseException {

    public ElasticsearchException(IResponseEnum responseEnum) {
        super(responseEnum);
    }

    public ElasticsearchException(IResponseEnum responseEnum, Object[] args) {
        super(responseEnum, args);
    }

    public ElasticsearchException(IResponseEnum responseEnum, Object[] args, String message) {
        super(responseEnum, args, message);
    }

    public ElasticsearchException(IResponseEnum responseEnum, Object[] args, String message, Throwable cause) {
        super(responseEnum, args, message, cause);
    }

    public ElasticsearchException(IResponseEnum responseEnum, Throwable cause) {
        super(responseEnum, cause);
    }
}
