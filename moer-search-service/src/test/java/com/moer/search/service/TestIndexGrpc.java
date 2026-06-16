package com.moer.search.service;

import cn.hutool.core.date.DateUtil;
import com.alibaba.fastjson2.JSONObject;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.google.protobuf.Any;
import com.google.protobuf.InvalidProtocolBufferException;
import com.google.protobuf.Value;
import com.moer.base.lib.GrpcResult;
import com.moer.base.lib.IndexNameInfo;
import com.moer.search.message.*;
import com.moer.search.utils.UuidUtils;
import io.grpc.Grpc;
import io.grpc.InsecureChannelCredentials;
import io.grpc.ManagedChannel;
import org.assertj.core.util.Lists;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

public class TestIndexGrpc {

    public static String host = "localhost";
    public static int port = 19998;
    public static String indexName = "dev-gateway-server-dev-log-2024-04-26";


    public static void main(String[] args) {
//        根据索引名称获取索引详情
//        getIndexInfoByIndexName();
//        获取索引列表
//        indices();
//        创建索引
//        createIndiceMapping();
//        更新索引（添加字段）
//        updateIndiceMapping();
//        删除索引
//        dropIndice();
//        关闭索引
//        closeIndex();
//        开启索引
//        openIndex();
//        添加索引别名
//        addAlias();
//        移除索引别名
//        removeAlias();
//        获取所有别名
        getAllAliases();
    }

    /**
     * 获取所有别名
     */
    private static void getAllAliases() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(
                host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub =
                EsIndexServiceGrpc.newBlockingStub(managedChannel);

        GetAllAliasesRequest request = GetAllAliasesRequest.newBuilder().build();
        GrpcResult grpcResult = blockingStub.getAllAliases(request);
        System.out.println("Code: " + grpcResult.getCode());
        System.out.println("Message: " + grpcResult.getMessage());

        Object data = handleGrpcData(grpcResult);
        if (data != null) {
            System.out.println("All Aliases: " + data);

            // 如果返回的是Map或JSON，可以解析输出
            try {
                if (data instanceof String) {
                    String jsonStr = (String) data;
                    ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
                    Object json = mapper.readValue(jsonStr, Object.class);
                    System.out.println("All Aliases Mapping:\n" + mapper.writeValueAsString(json));
                }
            } catch (Exception e) {
                System.out.println("Parse error: " + e.getMessage());
            }
        }
    }


    private static void addAlias() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
//        indexName = "test1000";
        String alias = "mr";
        AddAliasRequest indicesRequest = AddAliasRequest.newBuilder()
                .setIndexName(indexName)
                .setAlias(alias)
                .build();
        GrpcResult grpcResult = blockingStub.addAlias(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        Boolean data = (Boolean) handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void removeAlias() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
//        indexName = "test1000";
        String alias = "mr";
        RemoveAliasRequest indicesRequest = RemoveAliasRequest.newBuilder()
                .setIndexName(indexName)
                .setAlias(alias)
                .build();
        GrpcResult grpcResult = blockingStub.removeAlias(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        Boolean data = (Boolean) handleGrpcData(grpcResult);
        System.out.println(data);
    }


    private static void closeIndex() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
        indexName = "test1000";
        CloseIndiceRequest indicesRequest = CloseIndiceRequest.newBuilder()
                .setIndexName(indexName)
                .build();
        GrpcResult grpcResult = blockingStub.closeIndex(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        Boolean data = (Boolean) handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void openIndex() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
        indexName = "test1000";
        OpenIndiceRequest indicesRequest = OpenIndiceRequest.newBuilder()
                .setIndexName(indexName)
                .build();
        GrpcResult grpcResult = blockingStub.openIndex(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        Boolean data = (Boolean) handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void dropIndice() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
        indexName = "test10-1-" + System.currentTimeMillis();
        DropIndiceRequest indicesRequest = DropIndiceRequest.newBuilder()
                .setIndexName(indexName)
                .build();
        GrpcResult grpcResult = blockingStub.dropIndice(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        Boolean data = (Boolean) handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void createIndiceMapping() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
        indexName = "test10-1-" + System.currentTimeMillis();
        String dslStr = "{\"settings\":{\"number_of_shards\":1,\"number_of_replicas\":1},\"mappings\":{\"properties\":{\"field1\":{\"type\":\"text\"},\"field2\":{\"type\":\"keyword\"}}}}";
        CreateIndiceMappingRequest indicesRequest = CreateIndiceMappingRequest.newBuilder()
                .setIndexName(indexName)
                .setObj(dslStr)
                .build();
        GrpcResult grpcResult = blockingStub.createIndiceMapping(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        Boolean data = (Boolean) handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void updateIndiceMapping() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
        indexName = "test1000x";
        String dslStr = "{\"properties\":{\"field1\":{\"type\":\"text\"},\"field2\":{\"type\":\"keyword\"},\"field3\":{\"type\":\"keyword\"}}}";
        UpdateIndiceMappingRequest indicesRequest = UpdateIndiceMappingRequest.newBuilder()
                .setIndexName(indexName)
                .setObj(dslStr)
                .build();
        GrpcResult grpcResult = blockingStub.updateIndiceMapping(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        Boolean data = (Boolean) handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void indices() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(
                host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub =
                EsIndexServiceGrpc.newBlockingStub(managedChannel);
        IndicesRequest indicesRequest = IndicesRequest.newBuilder().build();
        GrpcResult grpcResult = blockingStub.indices(indicesRequest);

        System.out.println("Code: " + grpcResult.getCode());
        System.out.println("Message: " + grpcResult.getMessage());

        String data = (String) handleGrpcData(grpcResult);
        System.out.println("\n=== 未格式化的数据 ===");
        System.out.println(data);

        extractedFormat(data);
    }


    private static void extractedFormat(String data) {
        System.out.println("\n=== 格式化后的数据 ===");
        try {
            ObjectMapper mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
            Object json = mapper.readValue(data, Object.class);
            String formatted = mapper.writeValueAsString(json);
            System.out.println(formatted);
        } catch (Exception e) {
            // 如果不是 JSON，直接输出
            System.out.println(data);
        }
    }

    private static void getIndexInfoByIndexName() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);

        IndexNameRequest matchRequest = IndexNameRequest.newBuilder()
                .setIndexName(indexName)
                .build();
        GrpcResult grpcResult = blockingStub.getIndexInfoByIndexName(matchRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = (String) handleGrpcData(grpcResult);
//        System.out.println(data);
        extractedFormat(data);
    }
    

    private static Object handleGrpcData(GrpcResult grpcResult) {
        Any data = grpcResult.getData();
        try {
            if (data.is(Value.class)) {
                // 解包 Any 对象并获取 Value 消息
                Value value = data.unpack(Value.class);
                if (value.getKindCase() == Value.KindCase.STRING_VALUE) {
                    String jsonString = value.getStringValue();
                    return jsonString;
                } else if (value.getKindCase() == Value.KindCase.BOOL_VALUE) {
                    Boolean boolValue = value.getBoolValue();
                    return boolValue;
                }
            }
        } catch (InvalidProtocolBufferException e) {
            e.printStackTrace();
        }
        return null;
    }
}
