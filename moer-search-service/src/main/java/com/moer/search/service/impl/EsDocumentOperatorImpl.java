package com.moer.search.service.impl;

import cn.hutool.core.collection.CollectionUtil;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.moer.search.entity.BatchDocument;
import com.moer.search.entity.EsDetail;
import com.moer.search.entity.SearchRequestDTO;
import com.moer.search.entity.SearchResultDTO;
import com.moer.search.enums.EsResultEnum;
import com.moer.search.enums.ResponseEnum;
import com.moer.search.service.EsDocumentOperatorInterface;
import com.moer.search.utils.*;
import lombok.extern.slf4j.Slf4j;
import org.frameworkset.elasticsearch.ElasticSearchHelper;
import org.frameworkset.elasticsearch.bulk.BulkConfig;
import org.frameworkset.elasticsearch.bulk.BulkData;
import org.frameworkset.elasticsearch.client.*;
import org.frameworkset.elasticsearch.entity.MapRestResponse;
import org.frameworkset.elasticsearch.entity.RestResponse;
import org.frameworkset.elasticsearch.entity.SearchHit;
import org.frameworkset.elasticsearch.handler.ElasticSearchMapResponseHandler;
import org.frameworkset.elasticsearch.handler.ElasticSearchResponseHandler;
import org.frameworkset.soa.BBossStringWriter;
import org.springframework.stereotype.Service;

import java.util.*;


/**
 * 文档操作服务实现类
 * 
 * <p>实现了 {@link EsDocumentOperatorInterface} 接口，提供 Elasticsearch 文档操作的具体实现。
 * 使用 BBoss Elasticsearch 客户端进行底层操作，支持单文档操作、批量操作和 DSL 查询。
 * 
 * <p>核心特性：
 * <ul>
 *   <li>支持路由（routing）机制</li>
 *   <li>支持刷新策略控制（立即刷新/延迟刷新）</li>
 *   <li>批量操作采用批量提交优化性能</li>
 *   <li>支持复杂 DSL 查询</li>
 *   <li>集成日志记录和异常处理</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 * @see EsDocumentOperatorInterface
 */
@Slf4j
@Service
public class EsDocumentOperatorImpl implements EsDocumentOperatorInterface {

    /**
     * 新增索引（路由方式）
     *
     * @param t            索引实体
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     * @return Boolean
     */
    @Override
    public Boolean saveDocument(BatchDocument.DataDTO t, Boolean isRefreshNow) {
        EsDetail esDetail = new EsDetail();
        try {
            long start = System.currentTimeMillis();
            String indexS = t.getIndex();
            String routting = t.getRouting();
            checkIndexIsExist(indexS);
            String id = t.getId();
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(StringUtils.isBlank(id));
            if (isRefreshNow == null) {
                isRefreshNow = false;
            }
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ClientOptions clientOptions = new ClientOptions();
            clientOptions.setRefreshOption("refresh=" + isRefreshNow);
            if (StringUtils.isNotEmpty(routting)) {
                clientOptions.setRouting(routting);
            }
            clientOptions.setId(id);
            String reuslt = clientUtil.addDateDocument(indexS, t.getObj(), clientOptions);
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            esDetail.setIndexS(indexS);
            String resultType = (String) jsonObject.get("result");
            if (resultType.equals(EsResultEnum.Created.jsonValue())) {
                log.info("ES<<插入请求耗时：{}, 插入索引：{}", betweenDate, indexS);
                return true;
            } else if (resultType.equals(EsResultEnum.Updated.jsonValue())) {
                log.info("ES<<插入请求耗时：{}, 插入索引：{} 数据已经存在，并更新完成", betweenDate, indexS);
                return true;
            } else if (resultType.equals(EsResultEnum.NoOp.jsonValue())) {
                log.info("ES<<插入请求耗时：{}, 插入索引：{}  数据已经存在，数据无变化，无需更新", betweenDate, indexS);
                return true;
            } else {
                log.error("ES<<插入请求耗时：{}, 插入出错", betweenDate);
                return false;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return false;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }


    /**
     * 批量添加索引数据
     *
     * @param list
     * @param isRefreshNow
     * @return
     */
    @Override
    public Boolean batchSaveDocuments(List<BatchDocument.DataDTO> list, Boolean isRefreshNow) {
        EsDetail esDetail = new EsDetail();
        try {
            long start = System.currentTimeMillis();
            if (isRefreshNow == null) {
                isRefreshNow = false;
            }
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(CollectionUtil.isEmpty(list));
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ElasticSearchRestClient client = clientUtil.getClient();
            StringBuilder builder = new StringBuilder();
            BBossStringWriter writer = new BBossStringWriter(builder);
            for (BatchDocument.DataDTO dataDTO : list) {
                String id = dataDTO.getId();
                ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(StringUtils.isBlank(id));
                BulkData bulkData = new BulkData(BulkData.INSERT, dataDTO.getObj());
                String indexName = dataDTO.getIndex();
                ResponseEnum.ES_INDEX_MISS.assertIsFalse(StringUtils.isBlank(indexName));
                bulkData.setIndex(indexName);
                ClientOptions clientOptions = new ClientOptions();
                clientOptions.setRefreshOption("refresh=" + isRefreshNow);
                String routting = dataDTO.getRouting();
                if (StringUtils.isNotEmpty(routting)) {
                    clientOptions.setRouting(routting);
                }
                clientOptions.setId(id);
                bulkData.setClientOptions(clientOptions);
                BuildTool.evalBuilk(writer, bulkData, client.isUpper7());
            }
            long clientStart = System.currentTimeMillis();
            writer.flush();
            String reuslt = client.executeHttp(BuildTool.buildActionUrl(null, BulkConfig.FILTER_PATH_EMPTY), builder.toString(), ClientUtil.HTTP_POST);
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            Integer ingestTook = (Integer) jsonObject.get("took");
            esDetail.setTook(ingestTook.longValue());
            boolean reason = (boolean) jsonObject.get("errors");
            if (!reason) {
                log.info("ES<<批量添加索引数据>>请求耗时：{}, 批处理是否成功：{}", ingestTook, !reason);
                return true;
            } else {
                String errorMessage = null;
                StringBuilder stringBuilder = new StringBuilder();
                JSONArray items = jsonObject.getJSONArray("items");
//                {"took":127,"errors":false,"items":[{"index":{"_index":"test10-1-2023.11.15","_id":"823U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":0,"_primary_term":1,"status":201}},{"index":{"_index":"test10-1-2023.11.15","_id":"9G3U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":1,"_primary_term":1,"status":201}},{"index":{"_index":"test10-1-2023.11.15","_id":"9W3U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":2,"_primary_term":1,"status":201}},{"index":{"_index":"test10-1-2023.11.15","_id":"9m3U0YsBbIMv_nXtuCvD","_version":1,"result":"created","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":3,"_primary_term":1,"status":201}}]}
                for (Object o : items) {
                    JSONObject item = (JSONObject) o;
                    JSONObject error = (JSONObject) item.get("error");
                    if (error != null) {
                        stringBuilder.append("id:").append(item.get("_id")).append(",reason:").append(error.get("reason")).append("\n");
                    }
                }
                errorMessage = stringBuilder.toString();
                esDetail.setReason(errorMessage);
                log.error("ES<<批量添加索引数据>>请求耗时：{}, 批处理是否成功：{}, 错误原因：{}", ingestTook, reason, errorMessage);
                return false;
            }

        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return false;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    /**
     * 更新索引数据
     *
     * @param t            更新数据
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     * @return Boolean
     */
    @Override
    public Boolean updateDocument(BatchDocument.DataDTO t, Boolean isRefreshNow) {
        EsDetail esDetail = new EsDetail();
        try {

            String indexS = t.getIndex();
            checkIndexIsExist(indexS);
            String id = t.getId();
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(StringUtils.isBlank(id));
            long start = System.currentTimeMillis();
            if (isRefreshNow == null) {
                isRefreshNow = false;
            }
            long clientStart = System.currentTimeMillis();
            long clientTime = System.currentTimeMillis() - clientStart;
//            String index,String indexType,Object id,Object params,String refreshOption,Boolean detect_noop,Boolean doc_as_upsert
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ClientOptions clientOptions = new ClientOptions();
            clientOptions.setRefreshOption("refresh=" + isRefreshNow);
            String routting = t.getRouting();
            if (StringUtils.isNotEmpty(routting)) {
                clientOptions.setRouting(routting);
            }
            clientOptions.setId(id);
            String reuslt = clientUtil.updateDocument(indexS, t.getObj(), clientOptions);
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            esDetail.setIndexS(indexS);
            String result = (String) jsonObject.get("result");
            if (result.equals(EsResultEnum.Updated.jsonValue()) || result.equals(EsResultEnum.NoOp.jsonValue())) {
                log.info("ES<<更新请求耗时：{}, 更新索引：{} ,docId:{}", betweenDate, indexS, id);
                return true;
            } else {
                log.error("ES<<更新请求耗时：{}, 更新出错 docId:{}", betweenDate, id);
                return false;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return false;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }


    /**
     * 批量更新索引数据
     *
     * @param list         更新数据集合
     * @param isRefreshNow 数据索引
     * @return Boolean
     */
    @Override
    public Boolean batchUpdateDocuments(List<BatchDocument.DataDTO> list, Boolean isRefreshNow) {
        EsDetail esDetail = new EsDetail();
        try {

            if (isRefreshNow == null) {
                isRefreshNow = false;
            }
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(CollectionUtil.isEmpty(list));
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ElasticSearchRestClient client = clientUtil.getClient();
            StringBuilder builder = new StringBuilder();
            BBossStringWriter writer = new BBossStringWriter(builder);
            for (BatchDocument.DataDTO dataDTO : list) {
                String id = dataDTO.getId();
                ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(StringUtils.isBlank(id));
                BulkData bulkData = new BulkData(BulkData.UPDATE, dataDTO.getObj());
                String indexName = dataDTO.getIndex();
                ResponseEnum.ES_INDEX_MISS.assertIsFalse(StringUtils.isBlank(indexName));
                bulkData.setIndex(indexName);
                ClientOptions clientOptions = new ClientOptions();
                clientOptions.setRefreshOption("refresh=" + isRefreshNow);
                String routting = dataDTO.getRouting();
                if (StringUtils.isNotEmpty(routting)) {
                    clientOptions.setRouting(routting);
                }
                clientOptions.setId(id);
                bulkData.setClientOptions(clientOptions);
                BuildTool.evalBuilk(writer, bulkData, client.isUpper7());
            }
            long clientStart = System.currentTimeMillis();
            writer.flush();
            String reuslt = client.executeHttp(BuildTool.buildActionUrl(null, BulkConfig.FILTER_PATH_EMPTY), builder.toString(), ClientUtil.HTTP_POST);
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            Integer ingestTook = (Integer) jsonObject.get("took");
            boolean reason = (boolean) jsonObject.get("errors");
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            esDetail.setTook(ingestTook.longValue());
            esDetail.setIsTimedOut(false);
            if (!reason) {
                log.info("ES<<批量更新>>请求耗时：{}, 批处理是否成功：{}", ingestTook, !reason);
                return true;
            } else {
                String errorMessage = null;
                StringBuilder stringBuilder = new StringBuilder();
                JSONArray items = jsonObject.getJSONArray("items");
//                {"took":7, "errors": false, "items":[{"index":{"_index":"test","_id":"1","_version":1,"result":"created","forced_refresh":false}}]}
//                {"errors":false,"items":[{"index":{"_id":"57164e5ba124450eba031ffb77790ab7","_index":"test10-1","status":200,"_primary_term":1,"result":"updated","_seq_no":5,"_shards":{"failed":0.0,"successful":1.0,"total":2.0},"_version":4,"forced_refresh":true}}],"took":20}
                for (Object o : items) {
                    JSONObject item = (JSONObject) o;
                    JSONObject update = (JSONObject) item.get("update");
                    JSONObject error = (JSONObject) update.get("error");
                    if (error != null) {
                        String reasonError = (String) error.get("reason");
//                        [8e3c6a630019473b998b9696235f27cb111]: document missing
                        String idError = reasonError.split(":")[0];
                        idError = idError.replace("[", "").replace("]", "").toString();
                        String reasonErrorStr = reasonError.split(":")[1];
                        stringBuilder.append("id:").append(idError).append(",reason:").append(reasonErrorStr).append("[&&]");
                    }
                }
                errorMessage = stringBuilder.toString();
                esDetail.setReason(errorMessage);
                log.error("ES<<批量更新>>请求耗时：{}, 批处理是否成功：{}, 错误原因：{}", ingestTook, !reason, errorMessage);
                return false;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return false;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    /**
     * 单个删除ES索引值
     *
     * @param id           文档Id
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     * @param indexS       数据索引
     * @return lang.Boolean
     */
    @Override
    public Boolean deleteDocument(String id, Boolean isRefreshNow, String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            if (StringUtils.isEmpty(id)) {
                ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(StringUtils.isEmpty(id));
            }
            long start = System.currentTimeMillis();
            if (isRefreshNow == null) {
                isRefreshNow = false;
            }

            checkIndexIsExist(indexS);
            long clientStart = System.currentTimeMillis();
            String indexType = "_doc";
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String reuslt = clientUtil.deleteDocument(indexS, indexType, id, "refresh=" + isRefreshNow);
            reuslt = reuslt.split("ResponseBody:")[1];
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            String resultType = (String) jsonObject.get("result");
            if (resultType.equals(EsResultEnum.Deleted.jsonValue())) {
                log.info("删除索引数据成功,ids:{}", id);
                return true;
            } else if (resultType.equals(EsResultEnum.NotFound.jsonValue())) {
                log.info("数索引数据不存在,ids:{}", id);
                return true;
            } else {
                log.info("删除索引数据失败,id:{},响应结果:{}", id, reuslt);
                return false;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }


    /**
     * 批量删除ES索引值
     *
     * @param ids          删除条件唯一值
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     * @param indexS       更新数据索引
     * @return lang.Boolean
     */
    @Override
    public Boolean batchDeleteDocuments(List<String> ids, Boolean isRefreshNow, String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            long start = System.currentTimeMillis();
            if (isRefreshNow == null) {
                isRefreshNow = false;
            }

            checkIndexIsExist(indexS);
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(CollectionUtil.isEmpty(ids));
            long clientStart = System.currentTimeMillis();
            String indexType = "_doc";
            String[] array = ids.toArray(new String[0]);
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String reuslt = clientUtil.deleteDocumentsWithrefreshOption(indexS, indexType, "refresh=" + isRefreshNow, array);
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
//            {"took":14,"errors":false,"items":[{"delete":{"_index":"test10-1","_id":"8e3c6a630019473b998b9696235f27cb111","_version":1,"result":"not_found","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":19,"_primary_term":1,"status":404}},{"delete":{"_index":"test10-1","_id":"8e3c6a630019473b998b9696235f27cb1112","_version":1,"result":"not_found","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":20,"_primary_term":1,"status":404}}]}
            Integer ingestTook = (Integer) jsonObject.get("took");
            boolean reason = (boolean) jsonObject.get("errors");
            if (!reason) {
                log.info("ES<<批量删除>>请求耗时：{}, 批处理是否成功：{}", ingestTook, !reason);
                return true;
            } else {
                String errorMessage = null;
                StringBuilder stringBuilder = new StringBuilder();
                JSONArray items = jsonObject.getJSONArray("items");
                for (Object o : items) {
                    JSONObject item = (JSONObject) o;
                    JSONObject error = (JSONObject) item.get("error");
                    if (error != null) {
                        stringBuilder.append("id:").append(item.get("_id")).append(",reason:").append(error.get("reason")).append("\n");
                    }
                }
                errorMessage = stringBuilder.toString();
                esDetail.setReason(errorMessage);
                log.error("ES<<批量删除>>请求耗时：{}, 批处理是否成功：{}, 错误原因：{}", ingestTook, reason, errorMessage);
                return false;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    @Override
    public Object getDocument(String id, String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            checkIndexIsExist(indexS);
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(StringUtils.isBlank(id));
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String result = clientUtil.getDocument(indexS, id);
            log.info("响应参数：{}", result);
            JSONObject document = JSON.parseObject(result);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            Object found = document.get("found");
            if (found.equals(Boolean.TRUE)) {
                JSONObject source = (JSONObject) document.get("_source");
                log.info("根据Id查询索引数据成功,id:{}: found:{}", id, found);
                return source;
            } else {
                log.info("根据Id查询索引数据失败,id:{}: found:{}", id, found);
                return null;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    @Override
    public List<?> getDocumentsByIds(List<String> ids, String indexS) {
        EsDetail esDetail = new EsDetail();
        List<Object> list = new ArrayList<>();
        try {
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            checkIndexIsExist(indexS);
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(CollectionUtil.isEmpty(ids));
            String[] array = ids.toArray(new String[0]);
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            String result = clientUtil.mgetDocuments(indexS, "", array);
            log.info("响应参数：{}", result);
            JSONObject document = JSON.parseObject(result);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            JSONArray docs = (JSONArray) document.get("docs");
            if (docs.size() > 0) {
                for (Object o : docs) {
                    JSONObject jsonObject = (JSONObject) o;
                    Object source = jsonObject.get("_source");
                    if (!Objects.isNull(source)) {
                        list.add(source);
                    }
                }
                log.info("根据Ids查询索引数据成功,ids:{}: 数据为:{}", ids, list.size());
            } else {
                log.info("根据Ids查询索引数据失败,ids:{}: 数据为:{}", ids, 0);
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
        return list;
    }


    @Override
    public SearchResultDTO<Map> searchDocuments(SearchRequestDTO searchRequest, String indexS) {
        SearchResultDTO<Map> tSearchResultVO = new SearchResultDTO<>();
        EsDetail esDetail = new EsDetail();
        List<Map> list = new ArrayList<>();
        try {
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            checkIndexIsExist(indexS);
            Map<String, Object> options = new HashMap(2);
            String actionUrl = SearchBuildTool.buildSearchDocumentRequest(indexS, null, options);
            String dsl = SearchBuildTool.matchByFieldValueDsl(searchRequest);
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ElasticSearchRestClient client = clientUtil.getClient();
            RestResponse response = client.executeRequest(actionUrl, dsl, new ElasticSearchResponseHandler(Object.class));
            String s = JsonConvertUtil.obj2String(response);
            log.info("响应参数：{}", s);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            esDetail.setDsl(dsl);
            esDetail.setIndexS(indexS);
            esDetail.setTotalShards(response.getShards().getTotal());
            esDetail.setShardFailures(response.getShards().getFailed());
            esDetail.setSkippedShards(response.getShards().getSkipped());
            esDetail.setSuccessfulShards(response.getShards().getSuccessful());
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            List<SearchHit> searchHits = response.getSearchHits().getHits();
            Map<String, Map<String, Object>> aggregations = response.getAggregations();
            if (searchHits.size() > 0) {
                for (SearchHit o : searchHits) {
                    Map<String, List<Object>> fields = o.getFields();
                    Map<String, List<Object>> highlight = o.getHighlight();
                    if (!CollectionUtil.isEmpty(fields)) {
                        Map<String, List<Object>> oFields = o.getFields();
                        Map<String, Object> resultMap = new HashMap<>();
                        for (Map.Entry<String, List<Object>> entry : oFields.entrySet()) {
                            String key = entry.getKey();
                            List<Object> listValue = entry.getValue();
                            if (!listValue.isEmpty()) {
                                Object value = listValue.get(0);
                                resultMap.put(key, value);
                            }
                        }
                        if (!Objects.isNull(resultMap)) {
                            if (!Objects.isNull(highlight)) {
                                resultMap.put("highlight", highlight);
                            }
                            list.add(resultMap);
                        }
                    } else {
                        Map source = o.asMap();
                        if (!Objects.isNull(source)) {
                            if (!Objects.isNull(highlight)) {
                                source.put("highlight", highlight);
                            }
                            list.add(source);
                        }
                    }
                }
                tSearchResultVO.setList(list);
                //统计本次查询的总量
                MapRestResponse searchResult = countByQuery(searchRequest, indexS, client);
                if (!Objects.isNull(searchResult)) {
                    long count = searchResult.getCount();
                    tSearchResultVO.setTotalSize(count);
                    esDetail.setTotal(count);
                }
                tSearchResultVO.setAggregations(aggregations);

                log.info("根据检索数据条件查询索引数据成功,actionUrl：{} dsl:{}", actionUrl, dsl);
                return tSearchResultVO;
            } else {
                log.info("根据Ids查询索引数据失败,actionUrl：{} dsl:{}", actionUrl, dsl);
                return null;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    /**
     * 按照条件查询总量
     *
     * @param searchRequest
     * @param indexS
     * @param client
     * @return
     */
    private MapRestResponse countByQuery(SearchRequestDTO searchRequest, String indexS, ElasticSearchRestClient client) {
        String dslCount = SearchBuildTool.matchByFieldValueDslCount(searchRequest);
        MapRestResponse searchResult = client.executeRequest(new StringBuilder().append(indexS).append("/_count").toString(),
                dslCount, new ElasticSearchMapResponseHandler());
        return searchResult;
    }

    private MapRestResponse countDslByQuery(String dslCount, String indexS, ElasticSearchRestClient client) {
        StringBuilder builder = new StringBuilder();
        builder.append("{").append("\"").append("query").append("\"").append(":").append(dslCount).append("}");
        MapRestResponse searchResult = client.executeRequest(new StringBuilder().append(indexS).append("/_count").toString(),
                builder.toString(), new ElasticSearchMapResponseHandler());
        return searchResult;
    }


    @Override
    public SearchResultDTO searchDocumentsByDsl(String dsl, String indexS) {
        SearchResultDTO<Map> tSearchResultVO = new SearchResultDTO<>();
        EsDetail esDetail = new EsDetail();
        List<Map> list = new ArrayList<>();
        try {
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            checkIndexIsExist(indexS);
            Map<String, Object> options = new HashMap(2);
            String actionUrl = SearchBuildTool.buildSearchDocumentRequest(indexS, null, options);
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ElasticSearchRestClient client = clientUtil.getClient();
            RestResponse response = client.executeRequest(actionUrl, dsl, new ElasticSearchResponseHandler(Object.class));
            String s = JsonConvertUtil.obj2String(response);
            log.info("响应参数：{}", s);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            List<SearchHit> searchHits = response.getSearchHits().getHits();
            Map<String, Map<String, Object>> aggregations = response.getAggregations();
            if (searchHits.size() > 0) {
                for (SearchHit o : searchHits) {
                    Map<String, List<Object>> fields = o.getFields();
                    if (!CollectionUtil.isEmpty(fields)) {
                        Map<String, List<Object>> oFields = fields;
                        Map<String, Object> resultMap = new HashMap<>();
                        for (Map.Entry<String, List<Object>> entry : oFields.entrySet()) {
                            String key = entry.getKey();
                            List<Object> listValue = entry.getValue();
                            if (!listValue.isEmpty()) {
                                Object value = listValue.get(0);
                                resultMap.put(key, value);
                            }
                        }
                        Map source = resultMap;
                        Map<String, List<Object>> highlight = o.getHighlight();
                        if (!Objects.isNull(resultMap)) {
                            if (!Objects.isNull(highlight)) {
                                resultMap.put("highlight", highlight);
                            }
                            list.add(source);
                        }
                    } else {
                        Map source = (Map) o.getSource();
                        Map<String, List<Object>> highlight = o.getHighlight();
                        if (!Objects.isNull(source)) {
                            if (!Objects.isNull(highlight)) {
                                source.put("highlight", highlight);
                            }
                            list.add(source);
                        }
                    }
                }
                tSearchResultVO.setList(list);
                Map map = JSONObject.parseObject(dsl, Map.class);
                if (map.containsKey("query")) {
                    String dslCount = JSONObject.toJSONString(map.get("query"));
                    //统计本次查询的总量
                    MapRestResponse searchResult = countDslByQuery(dslCount, indexS, client);
                    if (!Objects.isNull(searchResult)) {
                        long count = searchResult.getCount();
                        tSearchResultVO.setTotalSize(count);
                        esDetail.setTotal(count);
                    }
                }
                tSearchResultVO.setAggregations(aggregations);
                log.info("根据检索数据条件查询索引数据成功,actionUrl：{} dsl:{}", actionUrl, dsl);
                return tSearchResultVO;
            } else {
                log.info("根据Ids查询索引数据失败,actionUrl：{} dsl:{}", actionUrl, dsl);
                return null;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    @Override
    public Long countDocumentsByIndexName(String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            long count = clientUtil.countAll(indexS);
            log.info("响应参数：{}", count);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            if (count >= 0) {
                log.info("根据索引下文档总数成功,indexName:{}: count:{}", indexS, count);
                return count;
            } else {
                log.info("根据索引下文档总数失败,indexName:{}: count:{}", 0);
                return 0L;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    @Override
    public Boolean deleteDocumentsByDsl(String dslStr, String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ElasticSearchRestClient client = clientUtil.getClient();
            String path = indexS + "/_delete_by_query?refresh";
            String reuslt = client.executeHttp(path, dslStr, ClientUtil.HTTP_POST);
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
//            {"took":14,"errors":false,"items":[{"delete":{"_index":"test10-1","_id":"8e3c6a630019473b998b9696235f27cb111","_version":1,"result":"not_found","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":19,"_primary_term":1,"status":404}},{"delete":{"_index":"test10-1","_id":"8e3c6a630019473b998b9696235f27cb1112","_version":1,"result":"not_found","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":20,"_primary_term":1,"status":404}}]}
            Integer ingestTook = (Integer) jsonObject.get("took");
            JSONArray failures = jsonObject.getJSONArray("failures");
            if (failures.size() == 0) {
                log.info("ES<<批量删除>>请求耗时：{}, 批处理是否成功：{}", ingestTook, true);
                return true;
            } else {
                String errorMessage = null;
                StringBuilder stringBuilder = new StringBuilder();
                JSONArray items = jsonObject.getJSONArray("items");
                for (Object o : items) {
                    JSONObject item = (JSONObject) o;
                    JSONObject error = (JSONObject) item.get("error");
                    if (error != null) {
                        stringBuilder.append("id:").append(item.get("_id")).append(",reason:").append(error.get("reason")).append("\n");
                    }
                }
                errorMessage = stringBuilder.toString();
                esDetail.setReason(errorMessage);
                log.error("ES<<批量删除>>请求耗时：{},删除失败的个数：{}, 错误原因：{}", ingestTook, failures.size(), errorMessage);
                return false;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return false;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    @Override
    public Boolean updateDocumentsByDsl(String dslStr, String indexS) {
        EsDetail esDetail = new EsDetail();
        try {
            checkIndexIsExist(indexS);
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ElasticSearchRestClient client = clientUtil.getClient();
            String path = indexS + "/_update_by_query?refresh";
            String reuslt = client.executeHttp(path, dslStr, ClientUtil.HTTP_POST);
            log.info("响应参数：{}", reuslt);
            JSONObject jsonObject = JSON.parseObject(reuslt);
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
//            {"took":14,"errors":false,"items":[{"delete":{"_index":"test10-1","_id":"8e3c6a630019473b998b9696235f27cb111","_version":1,"result":"not_found","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":19,"_primary_term":1,"status":404}},{"delete":{"_index":"test10-1","_id":"8e3c6a630019473b998b9696235f27cb1112","_version":1,"result":"not_found","forced_refresh":true,"_shards":{"total":2,"successful":1,"failed":0},"_seq_no":20,"_primary_term":1,"status":404}}]}
            Integer ingestTook = (Integer) jsonObject.get("took");
            JSONArray failures = jsonObject.getJSONArray("failures");
            if (failures.size() == 0) {
                log.info("ES<<批量更新>>请求耗时：{}, 批处理是否成功：{}", ingestTook, true);
                return true;
            } else {
                String errorMessage = null;
                StringBuilder stringBuilder = new StringBuilder();
                JSONArray items = jsonObject.getJSONArray("items");
                for (Object o : items) {
                    JSONObject item = (JSONObject) o;
                    JSONObject error = (JSONObject) item.get("error");
                    if (error != null) {
                        stringBuilder.append("id:").append(item.get("_id")).append(",reason:").append(error.get("reason")).append("\n");
                    }
                }
                errorMessage = stringBuilder.toString();
                esDetail.setReason(errorMessage);
                log.error("ES<<批量更新>>请求耗时：{},更新失败的个数：{}, 错误原因：{}", ingestTook, failures.size(), errorMessage);
                return false;
            }
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            return false;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
    }

    /**
     * 通过 SQL 查询索引数据
     *
     * @param sql SQL 查询语句
     * @return 查询结果
     */
    @Override
    public Map<String, Object> searchBySql(String sql) {
        EsDetail esDetail = new EsDetail();
        try {
            long start = System.currentTimeMillis();
            long clientStart = System.currentTimeMillis();
            
            ResponseEnum.BUSINESS_ES_OPERATION_ID_FAIL.assertIsFalse(StringUtils.isBlank(sql));
            
            ClientInterface clientUtil = ElasticSearchHelper.getRestClientUtil();
            ElasticSearchRestClient client = clientUtil.getClient();
            
            String path = "/_sql";
            String requestBody = "{\"query\": \"" + sql.replace("\"", "\\\"") + "\"}";
            
            String result = client.executeHttp(path, requestBody, ClientUtil.HTTP_POST);
            log.info("SQL查询响应参数：{}", result);
            
            long clientTime = System.currentTimeMillis() - clientStart;
            esDetail.setClientConnectionTime(clientTime);
            long betweenDate = System.currentTimeMillis() - start;
            esDetail.setTook(betweenDate);
            esDetail.setIsTimedOut(false);
            StackTraceElement stackTraceElement = Thread.currentThread().getStackTrace()[1];
            esDetail.setOperation(operation(stackTraceElement));
            esDetail.setDsl(sql);
            
            JSONObject jsonObject = JSON.parseObject(result);
            Map<String, Object> resultMap = new HashMap<>();
            
            if (jsonObject.containsKey("columns") && jsonObject.containsKey("rows")) {
                JSONArray columns = jsonObject.getJSONArray("columns");
                JSONArray rows = jsonObject.getJSONArray("rows");
                
                List<String> columnNames = new ArrayList<>();
                for (Object columnObj : columns) {
                    JSONObject column = (JSONObject) columnObj;
                    columnNames.add(column.getString("name"));
                }
                
                List<Map<String, Object>> rowsList = new ArrayList<>();
                for (Object rowObj : rows) {
                    JSONArray row = (JSONArray) rowObj;
                    Map<String, Object> rowMap = new LinkedHashMap<>();
                    for (int i = 0; i < columnNames.size(); i++) {
                        rowMap.put(columnNames.get(i), row.get(i));
                    }
                    rowsList.add(rowMap);
                }
                
                resultMap.put("rows", rowsList);
                resultMap.put("columns", columns);
            }
            
            if (jsonObject.containsKey("total")) {
                resultMap.put("total", jsonObject.getLong("total"));
            }
            if (jsonObject.containsKey("size")) {
                resultMap.put("size", jsonObject.getInteger("size"));
            }
            
            if (jsonObject.containsKey("aggregations")) {
                resultMap.put("aggregations", jsonObject.get("aggregations"));
            }
            
            log.info("ES SQL查询成功, SQL:{}, 耗时:{}ms", sql, betweenDate);
            return resultMap;
            
        } catch (Exception e) {
            ExceptionUtils.exception(esDetail, e);
            log.error("ES SQL查询失败, SQL:{}, 错误:{}", sql, e.getMessage());
            return null;
        } finally {
            EsThreadLocal.setEsDetail(Collections.singletonList(esDetail));
        }
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
