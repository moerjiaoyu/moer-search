package com.moer.search.service;

import org.frameworkset.elasticsearch.entity.ESIndice;

import java.util.List;
import java.util.Map;

/**
 * 索引操作服务接口
 * 
 * <p>定义了 Elasticsearch 索引管理的核心接口方法，包括索引的创建、删除、更新、查询、关闭、开启以及别名管理。
 * 
 * <p>索引管理功能：
 * <ul>
 *   <li>索引信息查询：获取单个索引详情、获取所有索引列表</li>
 *   <li>索引生命周期管理：创建、更新、删除索引</li>
 *   <li>索引状态管理：关闭、开启索引</li>
 *   <li>索引别名管理：添加、移除索引别名</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
public interface EsIndexOperatorInterface {

    /**
     * 获取索引详情
     *
     * @param indexS 索引名称称
     * @return
     */
    Map<String, Object> getIndexInfoByIndexName(String indexS);

    /**
     * 查询所有的索引列表
     *
     * @return
     */
    List<ESIndice> indices();

    /**
     * 创建索引
     *
     * @param indexName
     * @param dslMap 索引结构[settings、mappings]使用json字符串传递{"settings":{"number_of_shards":1,"number_of_replicas":1},"mappings":{"properties":{"field1":{"type":"text"},"field2":{"type":"keyword"}}}}
     *
     * @return
     */
    Boolean createIndiceMapping(String indexName, Map<String, Object> dslMap);

    /**
     * 更新索引
     *
     * @param indexName 索引名称
     * @param dslMap  索引结构字段[properties]使用json字符串传递 {"properties":{"field1":{"type":"text"},"field2":{"type":"keyword"},"field3":{"type":"keyword"}}}
     * @return
     */
    Boolean updateIndiceMapping(String indexName, Map<String, Object> dslMap);


    /**
     * 删除索引
     *
     * @param indexName 索引名称
     * @return
     */
    Boolean dropIndice(String indexName);

    /**
     * 关闭索引
     *
     * @param indexName
     * @return
     */
    Boolean closeIndex(String indexName);

    /**
     * 开启索引
     *
     * @param indexName
     * @return
     */
    Boolean openIndex(String indexName);

    /**
     * 添加别名
     *
     * @param indexName 索引名称
     * @param alias     别名
     * @return
     */
    Boolean addAlias(String indexName, String alias);


    /**
     * 移除别名
     *
     * @param indexName 索引名称
     * @param alias     别名
     * @return
     */
    Boolean removeAlias(String indexName, String alias);


}
