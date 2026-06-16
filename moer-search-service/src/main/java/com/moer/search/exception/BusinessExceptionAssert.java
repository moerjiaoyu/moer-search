package com.moer.search.exception;


import com.moer.search.enums.IResponseEnum;

import java.text.MessageFormat;

public interface BusinessExceptionAssert extends IResponseEnum,BaseAssert {

    @Override
    default BaseException newException() {
        return new ElasticsearchException(this);
    }

    @Override
    default BaseException newException(Object... args) {
        String msg = MessageFormat.format(this.getMessage(), args);
        return new ElasticsearchException(this, args, msg);
    }

    @Override
    default BaseException newException(String message) {
        return new ElasticsearchException(this, null, message);
    }

    @Override
    default BaseException newException(String message, Object... args) {
        String msg = MessageFormat.format(message, args);
        return new ElasticsearchException(this, args, msg);
    }

    @Override
    default BaseException newException(Throwable t, Object... args) {
        String msg = MessageFormat.format(this.getMessage(), args);
        return new ElasticsearchException(this, args, msg, t);
    }
}
