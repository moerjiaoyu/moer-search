package com.moer.search.service.impl;

import cn.hutool.core.collection.CollectionUtil;
import com.alibaba.fastjson2.JSONObject;
import com.moer.search.entity.EsDetail;
import com.moer.search.enums.ResponseEnum;
import com.moer.search.exception.ElasticsearchException;
import com.moer.search.service.EsIndexOperatorInterface;
import com.moer.search.utils.EsThreadLocal;
import com.moer.search.utils.ExceptionUtils;
import com.moer.search.utils.StringUtils;
import lombok.extern.slf4j.Slf4j;
import org.frameworkset.elasticsearch.ElasticSearch;
import org.frameworkset.elasticsearch.ElasticSearchException;
import org.frameworkset.elasticsearch.ElasticSearchHelper;
import org.frameworkset.elasticsearch.client.ClientInterface;
import org.frameworkset.elasticsearch.client.ClientUtil;
import org.frameworkset.elasticsearch.entity.ESIndice;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * 索引操作服务实现类
 * 
 * <p>实现了 {@link EsIndexOperatorInterface} 接口，提供 Elasticsearch 索引管理的具体实现。
 * 使用 BBoss Elasticsearch 客户端进行底层操作，支持索引的创建、删除、更新、查询、关闭、开启和别名管理。
 * 
 * <p>核心特性：
 * <ul>
 *   <li>索引生命周期管理：创建、更新、删除索引</li>
 *   <li>索引状态管理：关闭、开启索引</li>
 *   <li>索引别名管理：添加、移除别名</li>
 *   <li>索引信息查询：获取单个索引详情、获取所有索引列表</li>
 *   <li>集成日志记录和异常处理</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 * @see EsIndexOperatorInterface
 */
@Slf4j
@Service
public class EsIndexOperatorInterfaceImpl implements EsIndexOperatorInterface {

    /**
     * 获取索引详情
     *
     * @param indexS 索引名称
     * @return
     */
    @Override
    public Map<String, Object> getIndexInfoByIndexName(String indexS) {
        Map<String, Object> map = new HashMap<>();
        EsDetail esDetail = new EsDetail();
        try {
            long start = System.currentTimeMillis();
            checkIndexIsExist(indexS);
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String reuslt = clientUtil.getClient().executeHttp("/" + indexS, ClientUtil.HTTP_GET);
            log.info("reuslt 响应参数：{}", reuslt);
            if (StringUtils.isEmpty(reuslt)) {
                return null;
            }
            map = JSONObject.parseObject(reuslt, Map.class);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            esDetail.setIndexS(indexS);
            return map;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    @Override
    public List<ESIndice> indices() {
        EsDetail esDetail = new EsDetail();
        try {
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            List<ESIndice> indexes = clientUtil.getIndexes();
            log.info("响应参数：{}", JSONObject.toJSONString(indexes));
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return indexes;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    @Override
    public Boolean createIndiceMapping(String indexS, Map<String, Object> dslMap) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String indiceMapping = clientUtil.createIndiceMapping(indexS, JSONObject.toJSONString(dslMap));
            log.info("响应参数：{}", JSONObject.toJSONString(indiceMapping));
            JSONObject jsonObject = JSONObject.parseObject(indiceMapping);
            Boolean acknowledged = jsonObject.getBooleanValue("acknowledged");
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return acknowledged;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return false;
    }

    @Override
    public Boolean updateIndiceMapping(String indexS, Map<String, Object> dslMap) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String action = indexS + "/_mapping";
            String indiceMapping = clientUtil.updateIndiceMapping(action, JSONObject.toJSONString(dslMap));
            log.info("响应参数：{}", indiceMapping);
            if (indiceMapping.contains("ResponseBody:")) {
                throw new ElasticSearchException(indiceMapping);
            }
            JSONObject jsonObject = JSONObject.parseObject(indiceMapping);
            Boolean acknowledged = jsonObject.getBooleanValue("acknowledged");
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return acknowledged;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return false;
    }

    @Override
    public Boolean dropIndice(String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String indiceMapping = clientUtil.dropIndice(indexS);
            log.info("响应参数：{}", indiceMapping);
            JSONObject jsonObject = JSONObject.parseObject(indiceMapping);
            Boolean acknowledged = jsonObject.getBooleanValue("acknowledged");
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return acknowledged;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return false;
    }

    @Override
    public Boolean closeIndex(String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String indiceMapping = clientUtil.closeIndex(indexS);
            log.info("响应参数：{}", indiceMapping);
            JSONObject jsonObject = JSONObject.parseObject(indiceMapping);
            Boolean acknowledged = jsonObject.getBooleanValue("acknowledged");
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return acknowledged;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return false;
    }

    @Override
    public Boolean openIndex(String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String indiceMapping = clientUtil.openIndex(indexS);
            log.info("响应参数：{}", indiceMapping);
            JSONObject jsonObject = JSONObject.parseObject(indiceMapping);
            Boolean acknowledged = jsonObject.getBooleanValue("acknowledged");
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return acknowledged;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return false;
    }


    @Override
    public Boolean addAlias(String indexS, String alias) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String indiceMapping = clientUtil.addAlias(indexS, alias);
            log.info("响应参数：{}", indiceMapping);
            JSONObject jsonObject = JSONObject.parseObject(indiceMapping);
            Boolean acknowledged = jsonObject.getBooleanValue("acknowledged");
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return acknowledged;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return false;
    }


    @Override
    public Boolean removeAlias(String indexS, String alias) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String indiceMapping = clientUtil.removeAlias(indexS, alias);
            log.info("响应参数：{}", indiceMapping);
            JSONObject jsonObject = JSONObject.parseObject(indiceMapping);
            Boolean acknowledged = jsonObject.getBooleanValue("acknowledged");
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            return acknowledged;
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return false;
    }

    private String operation(StackTraceElement stackTraceElement) {
        return stackTraceElement.getClassName() + "." + stackTraceElement.getMethodName() + "(...)";
    }

    /**
     * 检查索引是否存在
     *
     * @param indexS
     */
    public static void checkIndexIsExist(String indexS) {
        ResponseEnum.ES_INDEX_MISS.assertIsFalse(StringUtils.isBlank(indexS));
    }
}
