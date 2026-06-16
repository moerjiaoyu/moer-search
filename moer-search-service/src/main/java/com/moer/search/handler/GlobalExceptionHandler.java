package com.moer.search.handler;

import com.moer.search.entity.ErrorResponse;
import com.moer.search.entity.RequestDetail;
import com.moer.search.enums.IResponseEnum;
import com.moer.search.enums.ResponseEnum;
import com.moer.search.exception.ElasticsearchException;
import com.moer.search.utils.RequestDetailThreadLocal;
import com.moer.search.utils.ThreadPool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.ui.Model;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.ArrayList;
import java.util.List;

/**
 * 全局异常处理器
 * 
 * <p>统一处理应用中所有未捕获的异常，提供统一的错误响应格式。
 * 通过 {@link @RestControllerAdvice} 注解实现全局异常拦截。
 * 
 * <p>处理的异常类型：
 * <ul>
 *   <li>{@link ElasticsearchException} - Elasticsearch 业务异常</li>
 *   <li>{@link MethodArgumentNotValidException} - 参数校验异常</li>
 *   <li>{@link BindException} - 数据绑定异常</li>
 *   <li>{@link MissingServletRequestParameterException} - 缺少请求参数异常</li>
 *   <li>{@link HttpMessageNotReadableException} - 请求体解析异常</li>
 *   <li>{@link HttpRequestMethodNotSupportedException} - 请求方法不支持异常</li>
 *   <li>{@link HttpMediaTypeNotSupportedException} - 媒体类型不支持异常</li>
 *   <li>{@link MaxUploadSizeExceededException} - 文件上传大小超限异常</li>
 *   <li>{@link NoHandlerFoundException} - 请求路径未找到异常</li>
 *   <li>{@link Exception} - 其他未捕获异常</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 应用到所有@RequestMapping注解方法，在其执行之前初始化数据绑定器
     *
     * @param binder
     */
    @InitBinder
    public void initBinder(WebDataBinder binder) {
        log.debug("请求有参数才进来:{} ", binder.getObjectName());
    }

    /**
     * 把值绑定到Model中，使全局@RequestMapping可以获取到该值
     *
     * @param model
     */
    @ModelAttribute
    public void addAttributes(Model model) {
        model.addAttribute("author", "wenhai");
    }

    /**
     * 处理自定义业务异常
     *
     * @param ex
     * @return
     */
    @ResponseStatus(HttpStatus.OK)
    @ExceptionHandler(value = ElasticsearchException.class)
    public ErrorResponse handleException(ElasticsearchException ex) {
        // 打印堆栈信息
        printApiCodeException(ex.getResponseEnum(), ex);
        return ErrorResponse.result(ex.getResponseEnum().getCode(), ex.getResponseEnum().getMessage());
    }

    /**
     * 非法参数验证异常
     *
     * @param ex
     * @return
     */
    @ResponseStatus(HttpStatus.OK)
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    public ErrorResponse handleException(MethodArgumentNotValidException ex) {
        printApiCodeException(ResponseEnum.FORMAT_PARAM, ex);
        BindingResult bindingResult = ex.getBindingResult();
        List<String> list = new ArrayList<>();
        List<FieldError> fieldErrors = bindingResult.getFieldErrors();
        for (FieldError fieldError : fieldErrors) {
            list.add(fieldError.getDefaultMessage());
        }
        return ErrorResponse.result(ResponseEnum.FORMAT_PARAM, list);
    }

    @ResponseStatus(HttpStatus.OK)
    @ExceptionHandler({HttpMediaTypeNotSupportedException.class})
    public ErrorResponse handlerException(HttpMediaTypeNotSupportedException ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.TYPE_METHOD_NOT_ALLOWED, ex);
        List<String> list = new ArrayList<>();
        list.add(ex.getMessage());
        return ErrorResponse.result(ResponseEnum.TYPE_METHOD_NOT_ALLOWED, list);
    }

    @ResponseStatus(HttpStatus.OK)
    @ExceptionHandler({HttpMessageNotReadableException.class})
    public ErrorResponse handleException(HttpMessageNotReadableException ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.FORMAT_PARAM, ex);
        List<String> list = new ArrayList<>();
        list.add(ex.getMessage());
        return ErrorResponse.result(ResponseEnum.FORMAT_PARAM, list);
    }

    /**
     * 缺少请求参数异常处理
     *
     * @param ex
     * @return
     */
    @ExceptionHandler(value = MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.OK)
    public ErrorResponse handleException(MissingServletRequestParameterException ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.FORMAT_PARAM, ex);
        List<String> list = new ArrayList<>();
        list.add(ex.getMessage());
        return ErrorResponse.result(ResponseEnum.FORMAT_PARAM);
    }

    /**
     * 404异常处理
     *
     * @param ex
     * @return
     */
    @ResponseStatus(HttpStatus.OK)
    @ExceptionHandler(NoHandlerFoundException.class)
    public ErrorResponse handleException(NoHandlerFoundException ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.NOT_FOUND, ex);
        List<String> list = new ArrayList<>();
        list.add(ex.getMessage());
        return ErrorResponse.result(ResponseEnum.NOT_FOUND);
    }

    /**
     * 不支持方法异常处理
     *
     * @param ex
     * @return
     */
    @ExceptionHandler(value = HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.OK)
    public ErrorResponse handleException(HttpRequestMethodNotSupportedException ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.TYPE_METHOD_NOT_ALLOWED, ex);
        List<String> list = new ArrayList<>();
        list.add(ex.getMessage());
        return ErrorResponse.result(ResponseEnum.TYPE_METHOD_NOT_ALLOWED);
    }

    /**
     * 非法获取异常
     *
     * @param ex
     * @return
     */
    @ExceptionHandler(value = IllegalAccessException.class)
    @ResponseStatus(HttpStatus.OK)
    public ErrorResponse handleException(IllegalAccessException ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.ILLEGAL_ACCESS, ex);
        List<String> list = new ArrayList<>();
        list.add(ex.getMessage());
        return ErrorResponse.result(ResponseEnum.ILLEGAL_ACCESS);
    }

    /**
     * spring默认上传大小100MB 超出大小捕获异常MaxUploadSizeExceededException
     */
    @ResponseStatus(HttpStatus.OK)
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ErrorResponse handleException(MaxUploadSizeExceededException ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.FILE_TOO_LARGE, ex);
        return ErrorResponse.result(ResponseEnum.FILE_TOO_LARGE);
    }

    /**
     * 空指针异常
     *
     * @param ex
     * @return
     */
    @ResponseStatus(HttpStatus.OK)
    @ExceptionHandler(NullPointerException.class)
    public ErrorResponse handleException(NullPointerException ex) {
        printApiCodeException(ResponseEnum.BUSINESS_NULL_EXCEPTION, ex);
        return ErrorResponse.result(ResponseEnum.SERVER_ERROR.getCode(), ResponseEnum.SERVER_ERROR.getMessage() + "-" + ResponseEnum.BUSINESS_NULL_EXCEPTION.getCode());
    }


    /**
     * 默认的异常处理
     *
     * @param ex
     * @return
     */
    @ExceptionHandler(value = Exception.class)
    @ResponseStatus(HttpStatus.OK)
    public ErrorResponse handleException(Exception ex) {
        // 打印堆栈信息
        printApiCodeException(ResponseEnum.SERVER_ERROR, ex);
        return ErrorResponse.result(ResponseEnum.SERVER_ERROR);
    }

    /**
     * 获取httpStatus格式化字符串
     *
     * @param responseEnum
     * @return
     */
    private String getApiCodeString(IResponseEnum responseEnum) {
        if (responseEnum != null) {
            return String.format("错误码值: %s, 错误详情描述: %s", responseEnum.getCode(), responseEnum.getMessage());
        }
        return null;
    }

    /**
     * 打印错误码及异常
     *
     * @param responseEnum
     * @param exception
     */
    private void printApiCodeException(IResponseEnum responseEnum, Exception exception) {
        RequestDetail requestDetail = RequestDetailThreadLocal.getRequestDetail();
        if (requestDetail!=null) {
            StringBuffer error = new StringBuffer();
            error.append("\n--------------------------------------------------------------------------------\n");
            error.append("       Trace ID             : ").append(requestDetail.getTraceId());
            error.append("\n     Request Path         : ").append(requestDetail.getPath());
            error.append("\n     Request IP           : ").append(requestDetail.getIp());
            error.append("\n     Request AppKey       : ").append(requestDetail.getAppKey());
            error.append("\n     Error info           : ").append(getApiCodeString(responseEnum));
            error.append("\n--------------------------------------------------------------------------------\n");
            log.error("{}", error, exception);
            ThreadPool.execute(() -> {
                String[] tags = requestDetail.getTags();
                if (null == tags || tags.length == 0) {
                    log.error("tags为空=====， 错误信息：{}", getApiCodeString(responseEnum));
                }
//            Metrics.counter("api_report_request_fail_count", tags).increment();
            });
        }
    }
}
