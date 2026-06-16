package com.moer.search.controller;


import com.moer.search.entity.RestResult;
import com.moer.search.service.EsIndexOperatorInterface;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.frameworkset.elasticsearch.entity.ESIndice;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 索引管理控制器
 * 
 * <p>提供 Elasticsearch 索引的管理操作接口，包括索引的创建、删除、更新、关闭、开启等操作。
 * 同时支持索引别名的管理功能。
 * 
 * <p>主要功能：
 * <ul>
 *   <li>索引信息查询：获取单个索引详情、获取所有索引列表</li>
 *   <li>索引操作：创建、更新、删除索引</li>
 *   <li>索引状态管理：关闭、开启索引</li>
 *   <li>索引别名管理：添加、移除索引别名</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Api(tags = "索引管理")
@RequestMapping("/v1/api/index")
@RestController
public class EsIndexController {

    /**
     * 索引操作服务接口
     */
    private final EsIndexOperatorInterface esIndexOperatorInterface;

    /**
     * 构造函数注入
     *
     * @param esIndexOperatorInterface 索引操作服务接口
     */
    public EsIndexController(EsIndexOperatorInterface esIndexOperatorInterface) {
        this.esIndexOperatorInterface = esIndexOperatorInterface;
    }

    /**
     * 获取索引名称获取索引详情
     *
     * @param indexName 索引名称
     * @return
     */
    @ApiOperation(value = "获取单条索引数据")
    @GetMapping("/getIndexInfoByIndexName/{indexName}")
    public RestResult getDocumentById(@PathVariable String indexName) {
        Map<String, Object> byIndexName = esIndexOperatorInterface.getIndexInfoByIndexName(indexName);
        return RestResult.success(byIndexName);
    }

    /**
     * 获取所有索引
     *
     * @return
     */
    @ApiOperation(value = "获取所有索引")
    @GetMapping("/indices")
    public RestResult<List<ESIndice>> indices() {
        List<ESIndice> document = esIndexOperatorInterface.indices();
        return RestResult.success(document);
    }

    /**
     * 创建索引
     *
     * @param indexName 索引名称
     * @param dsl       索引dsl脚本
     * @return
     */
    @ApiOperation(value = "创建索引")
    @PostMapping("/createIndiceMapping/{indexName}")
    public RestResult<Boolean> createIndiceMapping(@PathVariable String indexName,
                                                   @RequestBody Map<String, Object> dsl) {
        return RestResult.success(esIndexOperatorInterface.createIndiceMapping(indexName, dsl));
    }

    /**
     * 更新索引
     *
     * @param indexName 索引名称
     * @param dsl       索引dsl脚本
     * @return
     */
    @ApiOperation(value = "更新索引")
    @PutMapping("/updateIndiceMapping/{indexName}")
    public RestResult<Boolean> updateIndiceMapping(@PathVariable String indexName,
                                                   @RequestBody Map<String, Object> dsl) {
        return RestResult.success(esIndexOperatorInterface.updateIndiceMapping(indexName, dsl));
    }

    /**
     * 删除索引
     *
     * @param indexName 索引名称
     * @return
     */
    @ApiOperation(value = "删除索引")
    @DeleteMapping("/dropIndice/{indexName}")
    public RestResult<Boolean> dropIndice(@PathVariable String indexName) {
        return RestResult.success(esIndexOperatorInterface.dropIndice(indexName));
    }

    /**
     * 关闭索引
     *
     * @param indexName 索引名称
     * @return
     */
    @ApiOperation(value = "关闭索引")
    @PutMapping("/closeIndex/{indexName}")
    public RestResult<Boolean> closeIndex(@PathVariable String indexName) {
        return RestResult.success(esIndexOperatorInterface.closeIndex(indexName));
    }

    /**
     * 开启索引
     *
     * @param indexName 索引名称
     * @return
     */
    @ApiOperation(value = "开启索引")
    @PutMapping("/openIndex/{indexName}")
    public RestResult<Boolean> openIndex(@PathVariable String indexName) {
        return RestResult.success(esIndexOperatorInterface.openIndex(indexName));
    }

    /**
     * 添加索引别名
     *
     * @param indexName 索引名称
     * @param alias     索引别名
     * @return
     */
    @ApiOperation(value = "添加索引别名")
    @PostMapping("/addAlias/{indexName}/{alias}")
    public RestResult<Boolean> addAlias(@PathVariable String indexName,
                                        @PathVariable String alias) {
        return RestResult.success(esIndexOperatorInterface.addAlias(indexName, alias));
    }

    /**
     * 移除索引别名
     *
     * @param indexName 索引名称
     * @param alias     索引别名
     * @return
     */
    @ApiOperation(value = "移除索引别名")
    @PostMapping("/removeAlias/{indexName}/{alias}")
    public RestResult<Boolean> removeAlias(@PathVariable String indexName,
                                           @PathVariable String alias) {
        return RestResult.success(esIndexOperatorInterface.removeAlias(indexName, alias));
    }
}
