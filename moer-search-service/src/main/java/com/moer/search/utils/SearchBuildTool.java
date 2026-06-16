package com.moer.search.utils;

import cn.hutool.core.collection.CollectionUtil;
import com.moer.search.entity.*;
import com.moer.search.enums.ResponseEnum;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
public class SearchBuildTool {

    public static String buildSearchDocumentRequest(String indexName, String indexType, Map<String, Object> options) {

        StringBuilder builder = new StringBuilder();
        builder.append("/").append(indexName);
        if (indexType != null)
            builder.append("/").append(indexType);
        builder.append("/_search");
        if (options != null && options.size() > 0) {
            builder.append("?");
            Iterator<Map.Entry<String, Object>> iterable = options.entrySet().iterator();
            boolean first = true;
            while (iterable.hasNext()) {
                Map.Entry<String, Object> entry = iterable.next();
                if (first) {
                    builder.append(entry.getKey()).append("=").append(entry.getValue());
                    first = false;
                } else {
                    builder.append("&").append(entry.getKey()).append("=").append(entry.getValue());
                }
            }
        }
        return builder.toString();
    }


    public static String buildKnnSearchDocumentRequest(String indexName, String indexType, Map<String, Object> options) {

        StringBuilder builder = new StringBuilder();
        builder.append("/").append(indexName);
        if (indexType != null)
            builder.append("/").append(indexType);
        builder.append("/_search");
        if (options != null && options.size() > 0) {
            builder.append("?");
            Iterator<Map.Entry<String, Object>> iterable = options.entrySet().iterator();
            boolean first = true;
            while (iterable.hasNext()) {
                Map.Entry<String, Object> entry = iterable.next();
                if (first) {
                    builder.append(entry.getKey()).append("=").append(entry.getValue());
                    first = false;
                } else {
                    builder.append("&").append(entry.getKey()).append("=").append(entry.getValue());
                }
            }
        }
        return builder.toString();
    }


    public static String matchByFieldValueDslCount(SearchRequestDTO searchRequest) {
        String querySb = buildQueryString("query", searchRequest.getQueryString());
        StringBuilder builder = new StringBuilder();
        if (!StringUtils.isEmpty(querySb)){
            builder.append("{").append(querySb).append("}");
        }
        return builder.toString();
    }

    /**
     * 构造dsl语句
     *
     * @param searchRequest
     * @return
     */
    public static String matchByFieldValueDsl(SearchRequestDTO searchRequest) {
        /**
         * {
         *   "query": {},
         *   "aggs": {
         *     "NAME": {
         *       "AGG_TYPE": {}
         *     }
         *   },
         *   "from": 0,
         *   "size": 20,
         *   "sort": [
         *     {
         *       "FIELD": {
         *         "order": "desc"
         *       }
         *     }
         *   ],
         *   "highlight": {
         *     "pre_tags": {
         *       "<span style='red'>"
         *     },
         *     "post_tags": {
         *       "<span style='red'>"
         *     }
         *   },
         *   "suggest": {
         *     "YOUR_SUGGESTION": {
         *       "text": "YOUR TEXT",
         *       "term": {
         *         "FIELD": "MESSAGE"
         *       }
         *     }
         *   },
         *   "fields": [
         *     "{field}"
         *   ],
         * }
         */

        StringBuilder builder = new StringBuilder();
        builder.append("{");
        // 拼接from size 参数
        String buildFromSize = buildFromSize(searchRequest);
        if (!StringUtils.isEmpty(buildFromSize)) {
            builder.append(buildFromSize);
        }
        //拼接是否折叠
        String buildCollapse = buildCollapse(searchRequest);
        if (!StringUtils.isEmpty(buildCollapse)) {
            builder.append(",").append(buildCollapse);
        }

        //拼接返回字符串fields
        String buildFields = buildFields(searchRequest);
        ;
        if (!StringUtils.isEmpty(buildFields)) {
            builder.append(",").append(buildFields);
        }

        //拼接聚合字段
        String buildAgg = buildAgg(searchRequest);
        if (!StringUtils.isEmpty(buildAgg)) {
            builder.append(",").append(buildAgg);
        }
        //构造高亮参数
        String buildHighlight = buildHighlight(searchRequest);
        if (!StringUtils.isEmpty(buildHighlight)) {
            builder.append(",").append(buildHighlight);
        }
        //构造排序参数
        String buildSort = buildSort(searchRequest);
        if (!StringUtils.isEmpty(buildSort)) {
            builder.append(",").append(buildSort);
        }
        // 构造knn向量检索
        String buildKnn = buildKnn(searchRequest);
        if (!StringUtils.isEmpty(buildKnn)) {
            builder.append(",").append(buildKnn);
            String querySb = buildQuery(searchRequest,Boolean.TRUE);
            if (!StringUtils.isEmpty(querySb)){
                builder.append(",").append(querySb);
            }
        }else {
            // 拼接query string参数
            String querySb = buildQuery(searchRequest,Boolean.FALSE);
            builder.append(",").append(querySb);
        }
        builder.append("}");
        return builder.toString();
    }

    private static String buildKnn(SearchRequestDTO searchRequest) {
//        "knn": [ {
//            "field": "image-vector",
//                    "query_vector": [54, 10, -2],
//            "k": 5,
//                    "num_candidates": 50,
//                    "boost": 0.1
//        },
//        {
//            "field": "title-vector",
//                "query_vector": [1, 20, -52, 23, 10],
//            "k": 10,
//                "num_candidates": 10,
//                "boost": 0.5
//        }]
        StringBuilder builder = new StringBuilder();
        //拼接需要返回的字符串knns
        List<KnnSearchDTO> knns = searchRequest.getKnn();
        if (!CollectionUtil.isEmpty(knns) && knns.size() > 0) {
            builder.append("\"knn\":[");
            StringBuilder fieldsSb = new StringBuilder();
            for (int i = 0; i < knns.size(); i++) {
                KnnSearchDTO searchDTO = knns.get(i);
                String field = searchDTO.getField();
                List<Double> queryVector = searchDTO.getQueryVector();
                ResponseEnum.BUSINESS_ES_SEARCH_KNN_FIELD_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(field));
                ResponseEnum.BUSINESS_ES_SEARCH_KNN_QUERY_VECTOR_IS_NOT_NULL.assertIsFalse(CollectionUtil.isEmpty(queryVector));
                Integer k = Objects.isNull(searchDTO.getK()) ? 10 : searchDTO.getK();
                Integer numCandidates = Objects.isNull(searchDTO.getNumCandidates()) ? 10 : searchDTO.getNumCandidates();
                Float boost = Objects.isNull(searchDTO.getBoost()) ? 0.5f : searchDTO.getBoost();
                fieldsSb.append("{").append("\"").append("field").append("\"").append(":").append("\"").append(field).append("\"").append(",")
                        .append("\"").append("k").append("\"").append(":").append(k).append(",")
                        .append("\"").append("num_candidates").append("\"").append(":").append(numCandidates).append(",")
                        .append("\"").append("boost").append("\"").append(":").append(boost);
                String buildQueryVector = buildQueryVector(queryVector);
                ResponseEnum.BUSINESS_ES_SEARCH_KNN_QUERY_VECTOR_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(buildQueryVector));
                fieldsSb.append(",").append(buildQueryVector);
                KnnSearchDTO.FilterDTO filterDTO = searchDTO.getFilter();
                Optional.ofNullable(filterDTO)
                        .map(KnnSearchDTO.FilterDTO::getQueryString)
                        .ifPresent(queryStringDTO -> {
                            String queryString = buildQueryString("filter", queryStringDTO);
                            // 处理非空的queryString
                            if (StringUtils.isNotEmpty(queryString)) {
                                fieldsSb.append(",").append(queryString);
                            }
                        });

                fieldsSb.append("}");
            }
            fieldsSb.append("]");
            builder.append(fieldsSb);
        }
        return builder.toString();
    }


    private static String buildQueryVector(List<Double> queryVector) {
        StringBuilder builder = new StringBuilder();
        //拼接需要返回的字符串fields
        if (!CollectionUtil.isEmpty(queryVector) && queryVector.size() > 0) {
            Double[] array = queryVector.stream().toArray(Double[]::new);
            builder.append("\"").append("query_vector").append("\"").append(":").append("[");
            StringBuilder fieldsSb = new StringBuilder();
            for (int i = 0; i < array.length; i++) {
                Double key = array[i];
                fieldsSb.append(key);
                if (i != array.length - 1) {
                    fieldsSb.append(",");
                }
            }
            fieldsSb.append("]");
            builder.append(fieldsSb);
        }else {
            ResponseEnum.BUSINESS_ES_SEARCH_KNN_QUERY_VECTOR_IS_NOT_NULL.assertIsFalse(CollectionUtil.isEmpty(queryVector));
        }
        return builder.toString();
    }


    /**
     * 构造from和size参数
     *
     * @param searchRequest
     * @return
     */
    private static String buildFromSize(SearchRequestDTO searchRequest) {
        StringBuilder builder = new StringBuilder();
        Integer pageNo = 1;
        Integer pageSize = 10;
        PageInfoDTO pageInfo = searchRequest.getPageInfo();
        if (!Objects.isNull(pageInfo)) {
            pageNo = pageInfo.getCurrentPage();
            pageSize = pageInfo.getPageSize();
            if (Objects.isNull(pageNo)) {
                pageNo = 1;
            }
            if (Objects.isNull(pageSize)) {
                pageSize = 10;
            }
        }

        Integer from = (pageNo - 1) * pageSize;
        Integer size = pageSize;
        builder.append("\"from\":").append(from).append(",\"size\":").append(size);
        return builder.toString();
    }

    /**
     * 构造需要返回的字符串fields
     *
     * @param searchRequest
     * @return
     */
    private static String buildFields(SearchRequestDTO searchRequest) {
        StringBuilder builder = new StringBuilder();
        //拼接需要返回的字符串fields
        List<String> fields = searchRequest.getFields();
        if (!CollectionUtil.isEmpty(fields) && fields.size() > 0) {
            String[] array = fields.stream().toArray(String[]::new);
            builder.append("\"fields\":[");
            StringBuilder fieldsSb = new StringBuilder();
            for (int i = 0; i < array.length; i++) {
                String key = array[i];
                fieldsSb.append("\"").append(key).append("\"");
                if (i != array.length - 1) {
                    fieldsSb.append(",");
                }
            }
            fieldsSb.append("]");
            builder.append(fieldsSb);
        }
        return builder.toString();
    }

    /**
     * 拼接是否折叠
     *
     * @param searchRequest
     * @return
     */
    private static String buildCollapse(SearchRequestDTO searchRequest) {
        StringBuilder builder = new StringBuilder();
        String collapseField = searchRequest.getCollapseField();
        if (!StringUtils.isEmpty(collapseField)) {
            builder.append("\"collapse\":{")
                    .append("\"").append("field").append("\"").append(":").append("\"").append(collapseField).append("\"").append("}");
        }
        return builder.toString();
    }

    /**
     * 构造聚合参数
     *
     * @param searchRequest
     * @return
     */
    private static String buildAgg(SearchRequestDTO searchRequest) {
        StringBuilder builder = new StringBuilder();
        List<AggItemDTO> agg = searchRequest.getAgg();
        if (!CollectionUtil.isEmpty(agg) && agg.size() > 0) {
            builder.append("\"aggs\": {");
            StringBuilder aggItemSb = new StringBuilder();
            for (int i = 0; i < agg.size(); i++) {
                AggItemDTO dto = agg.get(i);
                String aggField = dto.getField();
                String aggType = dto.getType();
                Integer aggSize = dto.getSize();
                ResponseEnum.BUSINESS_ES_SEARCH_AGG_AGGFIELD_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(aggField));
                ResponseEnum.BUSINESS_ES_SEARCH_QUERY_STRING_DEFAULTOPERATOR_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(aggType));
                aggItemSb.append("\"").append("tx_group_").append(aggField).append("\"").append(":").append("{")
                        .append("\"").append(aggType).append("\"").append(":")
                        .append("{").append("\"").append("field").append("\"").append(":").append("\"").append(aggField).append("\"").append(",")
                        .append("\"").append("size").append("\"").append(":").append(aggSize);
                if (aggType.equals("date_histogram")) {
                    AggItemDTO.DateHistogramDTO dateHistogram = dto.getDateHistogram();
                    String field = dateHistogram.getField();
                    String calendarInterval = dateHistogram.getCalendarInterval();
                    ResponseEnum.BUSINESS_ES_SEARCH_AGG_DATE_HISTOGRAM_NOT_NULL.assertIsFalse(Objects.isNull(dateHistogram));
                    ResponseEnum.BUSINESS_ES_SEARCH_AGG_AGGFIELD_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(field));
                    ResponseEnum.BUSINESS_ES_SEARCH_AGG_DATE_HISTOGRAM_CALENDAR_INTERVAL_NOT_NULL.assertIsFalse(StringUtils.isEmpty(calendarInterval));
                    aggItemSb.append(",").append("\"").append("calendar_interval").append("\"").append(":").append("\"").append(calendarInterval).append("\"");
                }
                aggItemSb.append("}}");
                if (i != agg.size() - 1) {
                    aggItemSb.append(",");
                }
            }
            builder.append(aggItemSb);
            builder.append("}");
        }
        return builder.toString();
    }

    /**
     * 构造高亮参数
     *
     * @param searchRequest
     * @return
     */
    private static String buildHighlight(SearchRequestDTO searchRequest) {
        StringBuilder builder = new StringBuilder();
        //拼接高亮字段
        HighLightDTO highlights = searchRequest.getHighlights();
        if (!Objects.isNull(highlights)) {
            String order = highlights.getOrder();
            String preTag = highlights.getPreTag();
            String postTag = highlights.getPostTag();
            Integer noMatchSize = highlights.getNoMatchSize();
            Integer numberOfFragments = highlights.getNumberOfFragments();
            String boundaryScanner = highlights.getBoundaryScanner();
            String boundaryScannerLocale = highlights.getBoundaryScannerLocale();
            List<HighLightDTO.HighLightFieldsDTO> lightFieldsDTOS = highlights.getFields();
            ResponseEnum.BUSINESS_ES_SEARCH_AGG_DATE_HISTOGRAM_NOT_NULL.assertIsFalse(CollectionUtil.isEmpty(lightFieldsDTOS));
            builder.append("\"highlight\": {");
            if (!StringUtils.isEmpty(preTag)) {
                builder.append("\"").append("pre_tags").append("\"").append(":").append("\"").append(preTag).append("\"").append(",");
            }
            if (!StringUtils.isEmpty(postTag)) {
                builder.append("\"").append("post_tags").append("\"").append(":").append("\"").append(postTag).append("\"").append(",");
            }
            if (!Objects.isNull(numberOfFragments)) {
                builder.append("\"").append("number_of_fragments").append("\"").append(":").append("\"").append(numberOfFragments).append("\"").append(",");
            }
            if (!Objects.isNull(noMatchSize)) {
                builder.append("\"").append("no_match_size").append("\"").append(":").append("\"").append(noMatchSize).append("\"").append(",");
            }
            if (!StringUtils.isEmpty(boundaryScannerLocale)) {
                builder.append("\"").append("boundary_scanner_locale").append("\"").append(":").append("\"").append(boundaryScannerLocale).append("\"").append(",");
            }
            if (!StringUtils.isEmpty(boundaryScanner)) {
                builder.append("\"").append("boundary_scanner").append("\"").append(":").append("\"").append(boundaryScanner).append("\"").append(",");
            }
            if (!StringUtils.isEmpty(order)) {
                builder.append("\"").append("order").append("\"").append(":").append("\"").append(order).append("\"").append(",");
            }
            StringBuilder highLightFieldItemSb = new StringBuilder();
            builder.append("\"").append("fields").append("\"").append(":").append("{");
            for (int i = 0; i < lightFieldsDTOS.size(); i++) {
                HighLightDTO.HighLightFieldsDTO highLightFieldsDTO = lightFieldsDTOS.get(i);
                String highLightField = highLightFieldsDTO.getField();
                Integer noMatchSize1 = Objects.isNull(highLightFieldsDTO.getNoMatchSize()) ? 0 : highLightFieldsDTO.getNoMatchSize();
                Integer fragmentSize = Objects.isNull(highLightFieldsDTO.getFragmentSize()) ? 20 : highLightFieldsDTO.getFragmentSize();
                Integer numberOfFragments1 = Objects.isNull(highLightFieldsDTO.getNumberOfFragments()) ? 5 : highLightFieldsDTO.getNumberOfFragments();
                ResponseEnum.BUSINESS_ES_SEARCH_HIGHLIGHTS_HIGH_LIGHT_FIELDS_FIELD_NULL.assertIsFalse(StringUtils.isEmpty(highLightField));
                highLightFieldItemSb.append("\"").append(highLightField).append("\"").append(":").append("{")
                        .append("\"").append("number_of_fragments").append("\"").append(":").append("\"").append(numberOfFragments1).append("\"").append(",")
                        .append("\"").append("fragment_size").append("\"").append(":").append(fragmentSize).append(",")
                        .append("\"").append("no_match_size").append("\"").append(":").append(noMatchSize1);
                highLightFieldItemSb.append("}");
                if (i != lightFieldsDTOS.size() - 1) {
                    highLightFieldItemSb.append(",");
                }
            }
            builder.append(highLightFieldItemSb);
            builder.append("}}");
        }
        return builder.toString();
    }

    /**
     * 构造排序参数
     *
     * @param searchRequest
     * @return
     */
    private static String buildSort(SearchRequestDTO searchRequest) {
        StringBuilder builder = new StringBuilder();
        //拼接排序字段
        List<SortVO> sorts = searchRequest.getSortInfoList();
        if (!CollectionUtil.isEmpty(sorts) && sorts.size() > 0) {
            builder.append("\"sort\":[");
            StringBuilder orderSb = new StringBuilder();
            for (int i = 0; i < sorts.size(); i++) {
                SortVO sortVO = sorts.get(i);
                String fieldName = sortVO.getSortField();
                String sortWay = sortVO.getSortWay();
                orderSb.append("{").append("\"").append(fieldName).append("\"").append(":")
                        .append("{").append("\"").append("order").append("\"").append(":").append("\"").append(sortWay).append("\"").append("}}");
                if (i != sorts.size() - 1) {
                    orderSb.append(",");
                }
            }
            orderSb.append("]");
            builder.append(orderSb);
        }
        return builder.toString();
    }

    /**
     * 构建queryString 字符串
     *
     * @param queryOrFilter  query 或者 filter
     * @param queryStringDTO
     * @return
     */
    private static String buildQueryString(String queryOrFilter, QueryStringDTO queryStringDTO) {
        StringBuilder builder = new StringBuilder();
        ResponseEnum.BUSINESS_ES_SEARCH_QUERY_STRING_QUERY_OBJECT_IS_NOT_NULL.assertIsFalse(Objects.isNull(queryStringDTO));
        String query = queryStringDTO.getQuery();
        List<String> queryFields = queryStringDTO.getFields();
        String defaultOperator = queryStringDTO.getDefaultOperator();
        String type = queryStringDTO.getType();
        ResponseEnum.BUSINESS_ES_SEARCH_QUERY_STRING_QUERY_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(query));
        ResponseEnum.BUSINESS_ES_SEARCH_QUERY_STRING_DEFAULTOPERATOR_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(defaultOperator));
        ResponseEnum.BUSINESS_ES_SEARCH_QUERY_STRING_TYPE_IS_NOT_NULL.assertIsFalse(StringUtils.isEmpty(type));
        ResponseEnum.BUSINESS_ES_SEARCH_QUERY_STRING_DEFAULTOPERATOR_IS_NOT_NULL.assertIsFalse(CollectionUtil.isEmpty(queryFields));
        //拼接queryString
        builder.append("\"" + queryOrFilter + "\": {\"query_string\": {");
        builder.append("\"").append("query").append("\"").append(":").append("\"").append(query).append("\"").append(",");
        builder.append("\"").append("type").append("\"").append(":").append("\"").append(type).append("\"").append(",");
        builder.append("\"").append("default_operator").append("\"").append(":").append("\"").append(defaultOperator).append("\"").append(",");
        String[] queryStringFieldArr = queryFields.stream().toArray(String[]::new);
        builder.append("\"fields\":[");
        StringBuilder fieldsQueryStringFieldSb = new StringBuilder();
        for (int i = 0; i < queryStringFieldArr.length; i++) {
            String key = queryStringFieldArr[i];
            if (i == queryStringFieldArr.length - 1) {
                fieldsQueryStringFieldSb.append("\"").append(key).append("\"");
            } else {
                fieldsQueryStringFieldSb.append("\"").append(key).append("\"").append(",");
            }
        }
        fieldsQueryStringFieldSb.append("]");
        builder.append(fieldsQueryStringFieldSb);
        builder.append("}}");
        return builder.toString();
    }

    /**
     * 构造query参数
     *
     * @param searchRequest
     * @return
     */
    private static String buildQuery(SearchRequestDTO searchRequest,Boolean isKnn) {
        QueryStringDTO queryStringDTO = searchRequest.getQueryString();
        if (isKnn && Objects.isNull(queryStringDTO)){
            return null;
        }
        return buildQueryString("query", queryStringDTO);
    }
}
