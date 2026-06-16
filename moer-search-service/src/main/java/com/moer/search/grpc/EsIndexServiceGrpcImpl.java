package com.moer.search.grpc;

import com.alibaba.fastjson2.JSONObject;
import com.google.protobuf.Any;
import com.google.protobuf.Value;
import com.moer.base.lib.GrpcResult;
import com.moer.search.enums.ResponseEnum;
import com.moer.search.exception.ElasticsearchException;
import com.moer.search.message.*;
import com.moer.search.service.EsIndexOperatorInterface;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.frameworkset.elasticsearch.entity.ESIndice;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 索引管理 gRPC 服务实现类
 * 
 * <p>实现了索引管理的 gRPC 服务接口，提供通过 gRPC 协议访问的索引管理功能。
 * 继承自 {@link EsIndexServiceGrpc.EsIndexServiceImplBase}，自动注册为 gRPC 服务。
 * 
 * <p>提供的 gRPC 方法：
 * <ul>
 *   <li>getIndexInfoByIndexName - 根据索引名称查询索引详情</li>
 *   <li>indices - 获取所有索引列表</li>
 *   <li>createIndiceMapping - 创建索引</li>
 *   <li>updateIndiceMapping - 更新索引</li>
 *   <li>dropIndice - 删除索引</li>
 *   <li>closeIndex - 关闭索引</li>
 *   <li>openIndex - 开启索引</li>
 *   <li>addAlias - 添加索引别名</li>
 *   <li>getAllAliases - 获取所有索引别名</li>
 *   <li>removeAlias - 移除索引别名</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Service("esIndexServiceGrpcImpl")
@GrpcService
@Slf4j
@RequiredArgsConstructor
public class EsIndexServiceGrpcImpl extends EsIndexServiceGrpc.EsIndexServiceImplBase {

    private final EsIndexOperatorInterface esIndexOperatorInterface;

    /**
     * <pre>
     * 根据索引id查询数据
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void getIndexInfoByIndexName(IndexNameRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            Object document = esIndexOperatorInterface.getIndexInfoByIndexName(indexName);
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
     * 获取所有的索引
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void indices(IndicesRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            List<ESIndice> indices = esIndexOperatorInterface.indices();
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setStringValue(JSONObject.toJSONString(indices)).build());
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
     * 创建索引
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void createIndiceMapping(CreateIndiceMappingRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            String obj = request.getObj();
            Map map = JSONObject.parseObject(obj, Map.class);
            Boolean indiceMapping = esIndexOperatorInterface.createIndiceMapping(indexName, map);
            // 将对象打包成Any类型
            Any anyObject = Any.pack(Value.newBuilder().setBoolValue(indiceMapping).build());
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
     * 更新索引
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void updateIndiceMapping(UpdateIndiceMappingRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            String obj = request.getObj();
            Map map = JSONObject.parseObject(obj, Map.class);
            Boolean aBoolean = esIndexOperatorInterface.updateIndiceMapping(indexName, map);
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
     * 删除索引
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void dropIndice(DropIndiceRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            Boolean document = esIndexOperatorInterface.dropIndice(indexName);
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
     * 关闭索引
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void closeIndex(CloseIndiceRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            Boolean document = esIndexOperatorInterface.closeIndex(indexName);
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
     * 开启索引
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void openIndex(OpenIndiceRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            Boolean document = esIndexOperatorInterface.openIndex(indexName);
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
     * 添加索引别名
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void addAlias(com.moer.search.message.AddAliasRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            String alias = request.getAlias();
            Boolean document = esIndexOperatorInterface.addAlias(indexName, alias);
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
     * 添加索引别名
     * </pre>
     *
     * @param request
     * @param responseObserver
     */
    @Override
    public void removeAlias(com.moer.search.message.RemoveAliasRequest request, StreamObserver<GrpcResult> responseObserver) {
        try {
            String indexName = request.getIndexName();
            String alias = request.getAlias();
            Boolean document = esIndexOperatorInterface.removeAlias(indexName, alias);
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
}
