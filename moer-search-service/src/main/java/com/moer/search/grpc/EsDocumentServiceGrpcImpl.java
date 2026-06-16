package com.moer.search.grpc;

import com.alibaba.fastjson2.JSONObject;
import com.google.protobuf.Any;
import com.google.protobuf.Value;
import com.moer.base.lib.GrpcResult;
import com.moer.search.entity.BatchDocument;
import com.moer.search.entity.SearchResultDTO;
import com.moer.search.enums.ResponseEnum;
import com.moer.search.exception.ElasticsearchException;
import com.moer.search.message.*;
import com.moer.search.service.EsDocumentOperatorInterface;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 文档操作 gRPC 服务实现类
 * 
 * <p>实现了文档操作的 gRPC 服务接口，提供通过 gRPC 协议访问的文档操作功能。
 * 继承自 {@link EsDocumentServiceGrpc.EsDocumentServiceImplBase}，自动注册为 gRPC 服务。
 * 
 * <p>提供的 gRPC 方法：
 * <ul>
 *   <li>getDocumentById - 根据文档ID查询文档</li>
 *   <li>getDocumentsByIds - 批量根据文档ID查询文档</li>
 *   <li>deleteDocumentById - 根据文档ID删除文档</li>
 *   <li>batchDeleteDocumentsByIds - 批量根据文档ID删除文档</li>
 *   <li>saveDocument - 保存单条文档</li>
 *   <li>batchSaveDocuments - 批量保存文档</li>
 *   <li>updateDocument - 更新单条文档</li>
 *   <li>batchUpdateDocuments - 批量更新文档</li>
 *   <li>countDocumentsByIndexName - 获取索引文档总数</li>
 *   <li>searchDocumentsByDsl - 通过DSL查询文档</li>
 *   <li>deleteDocumentsByDsl - 通过DSL删除文档</li>
 *   <li>updateDocumentsByDsl - 通过DSL更新文档</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Service("esDocumentServiceGrpcImpl")
@GrpcService
@Slf4j
@RequiredArgsConstructor
public class EsDocumentServiceGrpcImpl extends EsDocumentServiceGrpc.EsDocumentServiceImplBase {

    private final EsDocumentOperatorInterface esOperatorInterface;

    /**
     * <pre>
     * 根据索引id查询数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void getDocumentById(DocumentIdRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String id = request.getId();
            String indexName = request.getIndexName();
            Object document = esOperatorInterface.getDocument(id, indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setStringValue(JSONObject.toJSONString(document)).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 批量根据索引id查询数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void getDocumentsByIds(DocumentIdsRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            List<String> ids = request.getIdsList().stream().collect(java.util.stream.Collectors.toList());
            String indexName = request.getIndexName();
            Object document = esOperatorInterface.getDocumentsByIds(ids, indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setStringValue(JSONObject.toJSONString(document)).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 根据索引id删除索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void deleteDocumentById(DocumentIdRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String id = request.getId();
            String indexName = request.getIndexName();
            Boolean document = esOperatorInterface.deleteDocument(id, Boolean.TRUE, indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(document).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 批量根据索引id集合删除数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void batchDeleteDocumentsByIds(DocumentIdsRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            List<String> ids = request.getIdsList().stream().collect(java.util.stream.Collectors.toList());
            String indexName = request.getIndexName();
            Boolean document = esOperatorInterface.batchDeleteDocuments(ids, Boolean.TRUE, indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(document).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 添加单条索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void saveDocument(SaveDocumentequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            BatchDocument.DataDTO t = new BatchDocument.DataDTO();
            DocumentData data = request.getData();
            String indexName = data.getIndexName();
            String routing = data.getRouting();
            String id = data.getId();
            String obj = data.getObj();
            t.setRouting(routing);
            t.setIndex(indexName);
            t.setId(id);
            Map map = JSONObject.parseObject(obj, Map.class);
            t.setObj(map);
            Boolean saveDocument = esOperatorInterface.saveDocument(t, Boolean.TRUE);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(saveDocument).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 批量添加多条索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void batchSaveDocuments(BatchSaveDocumentRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            List<BatchDocument.DataDTO> dataList = new ArrayList<>();
            List<DocumentData> documentDataList = request.getDataList();
            for (DocumentData documentData : documentDataList) {
                BatchDocument.DataDTO t = new BatchDocument.DataDTO();
                String routing = documentData.getRouting();
                String id = documentData.getId();
                String indexName = documentData.getIndexName();
                t.setRouting(routing);
                t.setIndex(indexName);
                t.setId(id);
                String obj = documentData.getObj();
                Map map = JSONObject.parseObject(obj, Map.class);
                t.setObj(map);
                dataList.add(t);
            }
            Boolean saveDocument = esOperatorInterface.batchSaveDocuments(dataList, Boolean.TRUE);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(saveDocument).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 添加单条索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void updateDocument(UpdateDocumentequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            BatchDocument.DataDTO t = new BatchDocument.DataDTO();
            DocumentData data = request.getData();
            String indexName = data.getIndexName();
            String routing = data.getRouting();
            String id = data.getId();
            String obj = data.getObj();
            t.setRouting(routing);
            t.setIndex(indexName);
            t.setId(id);
            Map map = JSONObject.parseObject(obj, Map.class);
            t.setObj(map);
            Boolean saveDocument = esOperatorInterface.updateDocument(t, Boolean.TRUE);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(saveDocument).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 批量更新多条索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void batchUpdateDocuments(BatchUpdateDocumentRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            List<BatchDocument.DataDTO> dataList = new ArrayList<>();
            List<DocumentData> documentDataList = request.getDataList();
            for (DocumentData documentData : documentDataList) {
                BatchDocument.DataDTO t = new BatchDocument.DataDTO();
                String routing = documentData.getRouting();
                String id = documentData.getId();
                String indexName = documentData.getIndexName();
                t.setRouting(routing);
                t.setIndex(indexName);
                t.setId(id);
                String obj = documentData.getObj();
                Map map = JSONObject.parseObject(obj, Map.class);
                t.setObj(map);
                dataList.add(t);
            }
            Boolean saveDocument = esOperatorInterface.batchUpdateDocuments(dataList, Boolean.TRUE);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(saveDocument).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 获取当前索引的文档总条数
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void countDocumentsByIndexName(CountDocumentRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexNameInfo().getIndexName();
            Long total = esOperatorInterface.countDocumentsByIndexName(indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setStringValue(total.toString()).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 通过dsl检索数据查询索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void searchDocumentsByDsl(DocumentsByDslDocumentRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            String dslStr = request.getDslStr();
            SearchResultDTO resultDTO = esOperatorInterface.searchDocumentsByDsl(dslStr, indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setStringValue(JSONObject.toJSONString(resultDTO)).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 通过dsl检索数据删除索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void deleteDocumentsByDsl(DocumentsByDslDocumentRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            String dslStr = request.getDslStr();
            Boolean aBoolean = esOperatorInterface.deleteDocumentsByDsl(dslStr, indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(aBoolean).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }

    /**
     * <pre>
     * 通过dsl检索数据更新索引数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void updateDocumentsByDsl(DocumentsByDslDocumentRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            String dslStr = request.getDslStr();
            Boolean aBoolean = esOperatorInterface.updateDocumentsByDsl(dslStr, indexName);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(aBoolean).build());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ResponseEnum.OK.getCode());
            builder.setMessage(ResponseEnum.OK.getMessage());
            builder.setData(anyObject);
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (ElasticsearchException ex) {
            // 捕获自定义异常并返回适当的 gRPC 状态
            Status status = Status.INVALID_ARGUMENT.withDescription(ex.getMessage());
            GrpcResult.Builder builder = GrpcResult.newBuilder();
            builder.setCode(ex.getResponseEnum().getCode());
            builder.setMessage(ex.getResponseEnum().getMessage());
            GrpcResult grpcResult = builder.build();
            responseObserver.onNext(grpcResult);
        } catch (Exception ex) {
            // 捕获其他异常并返回 UNKNOWN 错误状态
            Status status = Status.INTERNAL.withDescription("未知系统异常");
            responseObserver.onError(status.asRuntimeException());
        } finally {
            responseObserver.onCompleted();
        }
    }
}
