package com.moer.search.enums;
import com.moer.search.exception.BusinessExceptionAssert;
import lombok.Getter;


/**
 * 响应状态枚举类
 * 
 * <p>定义了应用中所有的响应状态码和对应的错误消息。
 * 实现了 {@link BusinessExceptionAssert} 接口，支持快速断言异常。
 * 
 * <p>状态码分类：
 * <ul>
 *   <li>2xx - 成功状态码</li>
 *   <li>4xx - 客户端错误状态码</li>
 *   <li>1000-1001 - 业务逻辑错误状态码</li>
 *   <li>3999 - 网络相关错误状态码</li>
 *   <li>5000-5005 - Elasticsearch 相关错误状态码</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 * @see BusinessExceptionAssert
 */
@Getter
public enum ResponseEnum implements BusinessExceptionAssert {

    /**
     * 请求成功
     */
    OK("200", "OK"),
    FORMAT_PARAM("400", "参数不合法/格式不正确"),
    NOT_FOUND("404", "未找到"),
    TYPE_METHOD_NOT_ALLOWED("405", "请求类型/方法不支持"),
    ILLEGAL_ACCESS("406", "非法获取"),
    BUSINESS_ES_INSERT_TIME_RANG_ERROR("1000", "不能输入起始时间esInsertTime.startEsInsertTime大于结束时间esInsertTime.endEsInsertTime范围搜索"),
    BUSINESS_ES_METRIC_FIELD_MISS("1000", "分析字段metricName缺失，不可为空"),
    BUSINESS_ES_GROUP_FIELD_MISS("1000", "分桶字段bucketName缺失，不可为空"),
    BUSINESS_ES_GROUP_LEVEL_2("1000", "分桶字段bucketTypes目前最多支持2层"),
    BUSINESS_ES_DELETE_SCROLL_ID_FAIL("1000", "清除滚动检索scrollId出错"),
    BUSINESS_ES_OPERATION_ID_FAIL("1000", "操作唯一主键uuid不能为空"),
    BUSINESS_ES_SEARCH_QUERY_STRING_QUERY_OBJECT_IS_NOT_NULL("1001", "queryString对象不能为空"),
    BUSINESS_ES_SEARCH_QUERY_STRING_QUERY_IS_NOT_NULL("1001", "queryString.query不能为空"),
    BUSINESS_ES_SEARCH_QUERY_STRING_FIELDS_IS_NOT_NULL("1001", "queryString.fields不能为空"),
    BUSINESS_ES_SEARCH_QUERY_STRING_TYPE_IS_NOT_NULL("1001", "queryString.type不能为空"),
    BUSINESS_ES_SEARCH_QUERY_STRING_DEFAULTOPERATOR_IS_NOT_NULL("1001", "queryString.defaultOperator不能为空"),
    BUSINESS_ES_SEARCH_AGG_AGGFIELD_IS_NOT_NULL("1001", "agg.aggField不能为空"),
    BUSINESS_ES_SEARCH_AGG_AGGTYPE_IS_NOT_NULL("1001", "agg.aggType不能为空"),
    BUSINESS_ES_SEARCH_AGG_DATE_HISTOGRAM_NOT_NULL("1001", "agg.dateHistogram不能为空"),
    BUSINESS_ES_SEARCH_AGG_DATE_HISTOGRAM_FEILD_NOT_NULL("1001", "agg.dateHistogram.filed不能为空"),
    BUSINESS_ES_SEARCH_AGG_DATE_HISTOGRAM_CALENDAR_INTERVAL_NOT_NULL("1001", "agg.dateHistogram.calendarInterval不能为空"),
    BUSINESS_ES_SEARCH_HIGHLIGHTS_preTag_NOT_NULL("1001", "highlights.preTag不能为空"),
    BUSINESS_ES_SEARCH_HIGHLIGHTS_HIGH_LIGHT_FIELDS_NOT_NULL("1001", "highlights.fields不能为空"),
    BUSINESS_ES_SEARCH_HIGHLIGHTS_HIGH_LIGHT_FIELDS_FIELD_NULL("1001", "highlights.fields.field不能为空"),
    BUSINESS_ES_SEARCH_KNN_FIELD_IS_NOT_NULL("1001","knn.field不能为空" ),
    BUSINESS_ES_SEARCH_KNN_QUERY_VECTOR_IS_NOT_NULL("1001","knn.field不能为空" ),
    BUSINESS_ES_OPERATION_LIST_FAIL("1000", "操作list不能为空"),
    BUSINESS_ES_CUSTOM_KEYWORD_HIGH_LIGHT_MISS("1000", "自定义关键词标红词语highLight.keywords字段缺失，不可为空"),
    BUSINESS_ES_CUSTOM_SCHEMA_HIGH_LIGHT_MISS("1000", "自定义以方案为主标红highLight.schemeIds字段缺失，不可为空"),
    ES_CLUSTER_NAME_NOT_FOUND("1000", "集群名称不能为空或者不存在"),
    ES_CLUSTER_NAME_NOT_CONFIG("1000", "application.yml中没有集群信息"),
    ES_CLUSTER_INFO_NOT_IS_NULL("1000", "cluster字段不能为空"),
    ES_ILLEGAL_ARGUMENT_EXCEPTION("1000", "[num_candidates] cannot be less than [k]"),
    NETWORK_INSTABILITY("3999", "网络不稳，请您重试~"),
    ES_INDEX_MISS("5000", "ES索引名或者别名不存在"),
    ES_INDEX_EXIST("5005", "ES索引名已存在"),
    ES_BUILDER_MISS("5001", "ES查询QueryBuilder条件（官方）丢失"),
    ES_DATA_FORMAT_ERROR("5002", "ES数据存储格式化有问题【有些字段与标准3.0字段类型不匹配】，请联系数据处理负责人"),
    ES_SERVER_ERROR("5003", "ES查询服务器内部错误"),
    ES_CLIENT_SERVER_ERROR("5004", "ES客户端连接网络超时，不稳定等会儿重试"),
    BUSINESS_NULL_EXCEPTION("5009", "业务出现空指针异常，请查看~"),
    SERVER_ERROR("500", "系统内部错误，请联系负责人"),
    FILE_TOO_LARGE("500", "文件超过100m");

    /**
     * 返回码
     */
    private String code;
    /**
     * 返回消息
     */
    private String message;


    ResponseEnum(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setMessage(String message) {
       this.message = message;
    }
}
