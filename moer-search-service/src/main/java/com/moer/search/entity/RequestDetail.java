package com.moer.search.entity;

import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;

@Data
@Accessors(chain = true)
public class RequestDetail implements Serializable {
    /**
     * 请求ip地址
     */
    private String ip;

    /**
     * 请求路径
     */
    private String path;

    /**
     * 请求appKey
     */
    private String appKey;

    private Long appKeyId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 接口ID
     */
    private Long interfaceId;

    /**
     * 接口 单价
     */
    private Long interfacePrice;

    /**
     * 用户总钱数
     */
    private Long costAllCount;

    /**
     * 用户剩余请求数据量单位分
     */
    private Long userAllowance;

    /**
     * 境内外权限（2：全部，0：境内，1：境外）
     */
    private String isForeignMedia;

    /**
     * 标签
     */
    private String[] tags;

    /**
     * 请求唯一值
     */
    private String traceId;

    /**
     * 是否使用老的签名方法
     */
    private Boolean isOldAutograph;

    /**
     * 业务用户ID，不传默认设置-1标记，有值以传入为主
     */
    private String businessUserId;

    /**
     * 是否重点客户，不传为空默认，非重点客户，1-标记重点客户，非1都是非重点，防止乱传
     */
    private String customerTag;
}
