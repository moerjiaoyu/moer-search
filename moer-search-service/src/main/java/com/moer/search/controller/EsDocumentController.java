package com.moer.search.controller;


import com.moer.search.entity.BatchDocument;
import com.moer.search.entity.RestResult;
import com.moer.search.entity.RequestDslDTO;
import com.moer.search.entity.SearchRequestDTO;
import com.moer.search.service.EsDocumentOperatorInterface;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 索引文档管理控制器
 * 
 * <p>提供 Elasticsearch 文档的增删改查操作接口，包括单文档操作和批量操作。
 * 支持通过 DSL 语句进行高级查询、删除和更新操作。
 * 
 * <p>主要功能：
 * <ul>
 *   <li>单文档操作：获取、添加、更新、删除</li>
 *   <li>批量操作：批量获取、批量添加、批量更新、批量删除</li>
 *   <li>DSL 查询：支持通过 DSL 语句进行复杂查询</li>
 *   <li>文档统计：获取索引文档总数</li>
 *   <li>DSL 批量操作：通过 DSL 语句批量删除、更新文档</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Api(tags = "索引数据管理")
@RequestMapping("/v1/api/documents")
@RestController
public class EsDocumentController {

    /**
     * 文档操作服务接口
     */
    private final EsDocumentOperatorInterface esOperatorInterface;

    /**
     * 构造函数注入
     *
     * @param esOperatorInterface 文档操作服务接口
     */
    public EsDocumentController(EsDocumentOperatorInterface esOperatorInterface) {
        this.esOperatorInterface = esOperatorInterface;
    }

    /**
     * 获取单条索引数据
     *
     * @param indexName 索引名称
     * @param id        索引id
     * @return
     */
    @ApiOperation(value = "获取单条索引数据")
    @GetMapping("/getDocumentById/{indexName}/{id}")
    public RestResult getDocumentById(@PathVariable String indexName,
                                      @PathVariable String id) {
        Object document = esOperatorInterface.getDocument(id, indexName);
        return RestResult.success(document);
    }

    /**
     * 批量获取索引数据
     *
     * @param indexName
     * @param ids
     * @return
     */
    @ApiOperation(value = "批量获取索引数据")
    @GetMapping("/getDocumentsByIds/{indexName}/{ids}")
    public RestResult getDocumentsByIds(@PathVariable String indexName,
                                        @PathVariable List<String> ids) {
        Object document = esOperatorInterface.getDocumentsByIds(ids, indexName);
        return RestResult.success(document);
    }

    /**
     * 删除单条索引数据
     *
     * @param indexName 索引名称
     * @param id        索引id
     * @return
     */
    @ApiOperation(value = "删除单条索引数据")
    @DeleteMapping("/deleteDocumentById/{indexName}/{id}")
    public RestResult deleteDocumentById(@PathVariable String indexName,
                                         @PathVariable String id) {
        Boolean aBoolean = esOperatorInterface.deleteDocument(id, Boolean.TRUE, indexName);
        return RestResult.success(aBoolean);
    }

    /**
     * 批量删除索引数据
     *
     * @param indexName 索引名称
     * @param ids       索引ids
     * @return
     */
    @ApiOperation(value = "批量删除索引数据")
    @DeleteMapping("/batchDeleteDocumentsByIds/{indexName}")
    public RestResult batchDeleteDocumentsByIds(@PathVariable String indexName,
                                                @RequestBody List<String> ids) {
        Boolean aBoolean = esOperatorInterface.batchDeleteDocuments(ids, Boolean.TRUE, indexName);
        return RestResult.success(aBoolean);
    }


    /**
     * 添加单条索引数据
     * 索引名称
     *
     * @param dataDTO 索引数据
     * @return
     */
    @ApiOperation(value = "添加单条索引数据")
    @PostMapping("/saveDocument")
    public RestResult saveDocument(@RequestBody BatchDocument.DataDTO dataDTO) {
        Boolean aBoolean = esOperatorInterface.saveDocument(dataDTO, Boolean.TRUE);
        return RestResult.success(aBoolean);
    }


    /**
     * 批量添加索引数据
     *
     * @param batchDocument 索引数据集合
     * @return
     */
    @ApiOperation(value = "批量添加索引数据")
    @PostMapping("/batchSaveDocuments")
    public RestResult batchSaveDocuments(@RequestBody BatchDocument batchDocument) {
        List<BatchDocument.DataDTO> documents = batchDocument.getData();
        Boolean aBoolean = esOperatorInterface.batchSaveDocuments(documents, Boolean.TRUE);
        return RestResult.success(aBoolean);
    }


    /**
     * 单条更新索引数据
     *
     * @param data 索引数据
     * @return
     */
    @ApiOperation(value = "单条更新索引数据")
    @PutMapping("/updateDocument")
    public RestResult updateDocument(@RequestBody BatchDocument.DataDTO data) {
        Boolean aBoolean = esOperatorInterface.updateDocument(data, Boolean.TRUE);
        return RestResult.success(aBoolean);
    }


    /**
     * 批量更新索引数据
     *
     * @param batchDocument 索引数据集合
     * @return
     */
    @ApiOperation(value = "批量更新索引数据")
    @PutMapping("/batchUpdateDocuments")
    public RestResult batchUpdateDocuments(@RequestBody BatchDocument batchDocument) {
        Boolean aBoolean = esOperatorInterface.batchUpdateDocuments(batchDocument.getData(), Boolean.TRUE);
        return RestResult.success(aBoolean);
    }


    /**
     * 搜索索引数据
     *
     * @param searchRequest 检索条件
     * @return
     */
    @ApiOperation(value = "搜索索引数据")
    @PostMapping("/searchDocuments/{indexName}")
    public RestResult searchDocuments(@PathVariable String indexName, @RequestBody SearchRequestDTO searchRequest) {
        return RestResult.success(esOperatorInterface.searchDocuments(searchRequest, indexName));
    }


    /**
     * 搜索索引数据
     *
     * @param searchRequest 搜索索引数据dsl语句
     * @return
     */
    @ApiOperation(value = "搜索索引数据dsl语句")
    @PostMapping("/searchDocumentsByDsl/{indexName}")
    public RestResult searchDocumentsByDsl(@PathVariable String indexName,
                                           @RequestBody RequestDslDTO searchRequest) {
        return RestResult.success(esOperatorInterface.searchDocumentsByDsl(searchRequest.getDslStr(), indexName));
    }


    /**
     * 查询索引下文档的总条数
     *
     * @param indexName
     * @return
     */
    @ApiOperation(value = "查询索引下文档的总条数")
    @PostMapping("/countDocumentsByIndexName/{indexName}")
    public RestResult countDocumentsByIndexName(@PathVariable String indexName) {
        return RestResult.success(esOperatorInterface.countDocumentsByIndexName(indexName));
    }


    /**
     * 通过dsl语句批量删除索引数据
     *
     * @param indexName     索引名称
     * @param searchRequest dsl对象
     * @return
     */
    @ApiOperation(value = "通过dsl语句批量删除索引数据")
    @PostMapping("/deleteDocumentsByDsl/{indexName}")
    public RestResult deleteDocumentsByDsl(@PathVariable String indexName,
                                           @RequestBody RequestDslDTO searchRequest) {
        return RestResult.success(esOperatorInterface.deleteDocumentsByDsl(searchRequest.getDslStr(), indexName));
    }

    /**
     * 通过dsl语句批量更新索引数据
     *
     * @param indexName
     * @param searchRequest dsl对象
     * @return
     */
    @ApiOperation(value = "通过dsl语句批量更新索引数据")
    @PostMapping("/updateDocumentsByDsl/{indexName}")
    public RestResult updateDocumentsByDsl(@PathVariable String indexName,
                                           @RequestBody RequestDslDTO searchRequest) {
        return RestResult.success(esOperatorInterface.updateDocumentsByDsl(searchRequest.getDslStr(), indexName));
    }
}
