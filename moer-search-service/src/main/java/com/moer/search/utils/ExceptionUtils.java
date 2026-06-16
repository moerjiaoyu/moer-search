package com.moer.search.utils;

import com.alibaba.fastjson2.JSONException;
import com.alibaba.fastjson2.JSONObject;
import com.moer.search.entity.EsDetail;
import com.moer.search.enums.IResponseEnum;
import com.moer.search.enums.ResponseEnum;
import com.moer.search.exception.ElasticsearchException;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.conn.HttpHostConnectException;
import org.frameworkset.elasticsearch.ElasticSearchException;

import java.io.IOException;

@Slf4j
public class ExceptionUtils {

    public static void exception(EsDetail esDetail, Exception e) {
        String message = e.getMessage();
        if (e instanceof IOException) {
            esDetail.setError(StringUtils.substring(message, 0, 2000));
            log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_CLIENT_SERVER_ERROR.getCode(), e);
            throw new RuntimeException(ResponseEnum.ES_CLIENT_SERVER_ERROR.getMessage(), e);
        } else if (e instanceof ElasticsearchException) {
            esDetail.setError(StringUtils.substring(message, 0, 2000));
            IResponseEnum responseEnum = ((ElasticsearchException) e).getResponseEnum();
            log.error("异常来源：错误码值：{}， 错误详情 ->", responseEnum.getCode(), e);
            throw new ElasticsearchException(responseEnum,e);
        } else if (e instanceof JSONException) {
            esDetail.setError(StringUtils.substring(message, 0, 2000));
            log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_DATA_FORMAT_ERROR.getCode(), e);
            throw new RuntimeException(ResponseEnum.ES_DATA_FORMAT_ERROR.getMessage(), e);
        } else if (e instanceof ElasticSearchException) {
            esDetail.setError(StringUtils.substring(message, 0, 2000));
            log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_SERVER_ERROR.getCode(), e);
            message = message.split("ResponseBody:")[1];
            JSONObject jsonObject = JSONObject.parseObject(message);
            if (jsonObject.containsKey("error")) {
                JSONObject error = (JSONObject) jsonObject.get("error");
                JSONObject causedBy = (JSONObject) error.get("caused_by");
                String type = "";
                String reason = "";
                if (causedBy != null) {
                     type = causedBy.getString("type");
                     reason = causedBy.getString("reason");
                }else{
                     type = error.getString("type");
                     reason = error.getString("reason");
                }
                if (type.equals("index_not_found_exception")) {
                    ResponseEnum esIndexMiss = ResponseEnum.ES_INDEX_MISS;
                    esIndexMiss.setMessage(reason);
                    log.error("异常来源：错误码值：{}， 错误详情 ->", esIndexMiss.getCode(), e);
                    throw new ElasticsearchException(esIndexMiss, e);
                }else if (type.equals("aliases_not_found_exception")){
                    ResponseEnum esIndexMiss = ResponseEnum.ES_INDEX_MISS;
                    esIndexMiss.setMessage(reason);
                    log.error("异常来源：错误码值：{}， 错误详情 ->", esIndexMiss.getCode(), e);
                    throw new ElasticsearchException(esIndexMiss, e);
                } else if (type.equals("illegal_argument_exception")) {
                    log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_ILLEGAL_ARGUMENT_EXCEPTION.getCode(), e);
                    ResponseEnum enumValue = ResponseEnum.ES_ILLEGAL_ARGUMENT_EXCEPTION;
                    // 动态修改字符串值
                    enumValue = ResponseEnum.ES_ILLEGAL_ARGUMENT_EXCEPTION;
                    enumValue.setMessage(reason);
                    throw new ElasticsearchException(enumValue, e);
                }else if (type.equals("resource_already_exists_exception")){
                    log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_INDEX_EXIST.getCode(), e);
                    ResponseEnum enumValue = ResponseEnum.ES_INDEX_EXIST;
                    // 动态修改字符串值
                    enumValue = ResponseEnum.ES_INDEX_EXIST;
                    enumValue.setMessage(reason);
                    throw new ElasticsearchException(enumValue, e);
                }else {
                    log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_ILLEGAL_ARGUMENT_EXCEPTION.getCode(), e);
                    ResponseEnum enumValue = ResponseEnum.ES_ILLEGAL_ARGUMENT_EXCEPTION;
                    // 动态修改字符串值
                    enumValue = ResponseEnum.ES_ILLEGAL_ARGUMENT_EXCEPTION;
                    enumValue.setMessage(reason);
                    throw new ElasticsearchException(enumValue, e);
                }
            } else {
                log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_DATA_FORMAT_ERROR.getCode(), e);
                throw new RuntimeException(ResponseEnum.ES_DATA_FORMAT_ERROR.getMessage(), e);
            }
        }else if (e instanceof HttpHostConnectException){
            esDetail.setError(StringUtils.substring(message, 0, 2000));
            log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_CLIENT_SERVER_ERROR.getCode(), e);
            throw new RuntimeException(ResponseEnum.ES_CLIENT_SERVER_ERROR.getMessage(), e);
        }else {
            esDetail.setError(StringUtils.substring(message, 0, 2000));
            log.error("异常来源：错误码值：{}， 错误详情 ->", ResponseEnum.ES_SERVER_ERROR.getCode(), e);
            throw new RuntimeException(ResponseEnum.ES_SERVER_ERROR.getMessage(), e);
        }
    }
}
