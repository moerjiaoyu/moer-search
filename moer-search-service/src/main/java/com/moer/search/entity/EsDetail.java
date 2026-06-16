package com.moer.search.entity;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;

@Data
@Accessors(chain = true)
public class EsDetail implements Serializable {

    /**
     * 操作
     */
    private String operation;

    /**
     * 时间跨度
     */
    private Integer realTime;

    /**
     * 客户端连接耗时
     */
    private Long clientConnectionTime;

    /**
     * 搜索请求耗费了多少毫秒
     */
    private Long took;

    /**
     * 是否超时
     */
    private Boolean isTimedOut;

    /**
     * 总分片
     */
    private Long totalShards;

    /**
     * 成功分片
     */
    private Long successfulShards;

    /**
     * 跳过分片数
     */
    private Long skippedShards;

    /**
     * 失败分片
     */
    private Long shardFailures;

    /**
     * 索引集合
     */
    private String indexS;

    /**
     * 查询dsl
     */
    private String dsl;

    /**
     * 原因
     */
    private String reason;

    /**
     * 总数据量
     */
    private long total;

    /**
     * 错误信息
     */
    private String error;
}
