package com.moer.search.service;

import com.moer.search.entity.BatchDocument;
import com.moer.search.entity.SearchRequestDTO;
import com.moer.search.entity.SearchResultDTO;

import java.util.List;
import java.util.Map;

/**
 * 文档操作服务接口
 * 
 * <p>定义了 Elasticsearch 文档操作的核心接口方法，包括文档的增删改查、批量操作和 DSL 查询。
 * 所有方法都支持刷新策略控制，允许调用方决定是否立即刷新索引到磁盘。
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
public interface EsDocumentOperatorInterface {

    /**
     * 新增索引（路由方式）
     *
     * @param t            索引实体
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     *                     集群名称
     * @return
     */
    Boolean saveDocument(BatchDocument.DataDTO t, Boolean isRefreshNow);

    /**
     * 批量添加索引数据
     *
     * @param list
     * @param isRefreshNow
     * @return
     */
    Boolean batchSaveDocuments(List<BatchDocument.DataDTO> list, Boolean isRefreshNow);

    /**
     * 更新索引数据
     *
     * @param t            更新数据
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     *                     集群名称
     * @return
     */
    Boolean updateDocument(BatchDocument.DataDTO t, Boolean isRefreshNow);

    /**
     * 批量更新索引数据
     *
     * @param list         更新数据集合
     * @param isRefreshNow 数据索引
     *                     集群名称
     * @return
     */
    Boolean batchUpdateDocuments(List<BatchDocument.DataDTO> list, Boolean isRefreshNow);

    /**
     * 单条删除ES索引值
     *
     * @param id           文档Id
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     * @param indexS       数据索引
     * @return lang.Boolean
     */
    Boolean deleteDocument(String id, Boolean isRefreshNow, String indexS);

    /**
     * 批量删除ES索引值
     *
     * @param ids          文档Id
     * @param isRefreshNow 否立即刷新磁盘，默认不立即刷新
     * @param indexS       数据索引
     *                     集群名称
     * @return lang.Boolean
     */
    Boolean batchDeleteDocuments(List<String> ids, Boolean isRefreshNow, String indexS);


    /**
     * 根据Id查询索引数据
     *
     * @param id     文档Id
     * @param indexS 数据索引
     *               集群名称
     * @return
     */
    Object getDocument(String id, String indexS);

    /**
     * 批量ids获取索引数据
     *
     * @param ids
     * @param indexS 数据索引
     *               集群名称
     * @return
     */
    List<?> getDocumentsByIds(List<String> ids, String indexS);


    /**
     * 检索数据
     *
     * @param searchRequest
     */
    SearchResultDTO<Map> searchDocuments(SearchRequestDTO searchRequest,String indexS);

    /**
     * 检索数据
     *
     * @param dslStr
     * @param indexS 索引名称
     *               集群名称
     * @return
     */
    SearchResultDTO searchDocumentsByDsl(String dslStr, String indexS);

    /**
     * 查询索引下文档的总条数
     *
     * @param indexS 索引名称
     *               集群名称
     * @return
     */
    Long countDocumentsByIndexName(String indexS);

    /**
     * 通过dsl删除索引数据
     * @param dslStr
     * @param indexName
     * @return
     */
    Boolean deleteDocumentsByDsl(String dslStr, String indexName);

    /**
     * 通过dsl更新索引数据
     * @param dslStr
     * @param indexName
     * @return
     */
    Boolean updateDocumentsByDsl(String dslStr, String indexName);

    /**
     * 通过 SQL 查询索引数据
     *
     * @param sql SQL 查询语句
     * @return 查询结果
     */
    Map<String, Object> searchBySql(String sql);
}
