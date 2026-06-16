package com.moer.search.service;

import cn.hutool.core.date.DateUtil;
import com.alibaba.fastjson2.JSONObject;
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

public class TestDocumentGrpc {

    public static String host = "192.168.30.94";
    public static int port = 19998;
    public static String indexName = "test10-1";


    public static void main(String[] args) {
//        getDocumentById();
//        getDocumentByIds();
//        saveDocument();
//        saveDocuments();
//        updateDocument();
//        countDocument();
//        searchDocumentByDsl();

        getIndexInfoByIndexName();
//        indices();
    }


    private static void indices() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsIndexServiceGrpc.EsIndexServiceBlockingStub blockingStub = EsIndexServiceGrpc.newBlockingStub(managedChannel);
        IndicesRequest indicesRequest = IndicesRequest.newBuilder().build();
        GrpcResult grpcResult = blockingStub.indices(indicesRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
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
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void searchDocumentByDsl() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsDocumentServiceGrpc.EsDocumentServiceBlockingStub blockingStub = EsDocumentServiceGrpc.newBlockingStub(managedChannel);

//        String dslStr = "{\n" +
//                "   \"from\": 0,\n" +
//                "  \"size\": 100,\n" +
//                "   \"query\": {\"match_all\": {}}\n" +
//                "}";
        indexName = "tilake_vectors";
        String dslStr = "{\n" +
                "  \"query\": {\n" +
                "    \"query_string\": {\n" +
                "      \"query\": \"(content:中共中央)\"\n" +
                "    }\n" +
                "  },\n" +
                "  \"highlight\": {\n" +
                "    \"pre_tags\": \"<font color='red'>\",\n" +
                "    \"post_tags\": \"</font>\",\n" +
                "    \"number_of_fragments\": 5,\n" +
                "    \"no_match_size\": 0,\n" +
                "    \"fields\": {\n" +
                "      \"title\": {\n" +
                "        \"number_of_fragments\": 5,\n" +
                "        \"fragment_size\": 20\n" +
                "      },\n" +
                "      \"content\": {\n" +
                "        \"fragment_size\": 20\n" +
                "      }\n" +
                "    },\n" +
                "    \"boundary_scanner_locale\": \"zh_CN\",\n" +
                "    \"boundary_scanner\": \"sentence\"\n" +
                "  }\n" +
                "}";
        DocumentsByDslDocumentRequest searchDocumentsByDslDocumentRequest = DocumentsByDslDocumentRequest.newBuilder()
                .setIndexName(indexName)
                .setDslStr(dslStr)
                .build();
        GrpcResult grpcResult = blockingStub.searchDocumentsByDsl(searchDocumentsByDslDocumentRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static void countDocument() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsDocumentServiceGrpc.EsDocumentServiceBlockingStub blockingStub = EsDocumentServiceGrpc.newBlockingStub(managedChannel);

        CountDocumentRequest matchRequest = CountDocumentRequest.newBuilder()
                .setIndexNameInfo(IndexNameInfo.newBuilder().setIndexName(indexName).build())
                .build();
        GrpcResult grpcResult = blockingStub.countDocumentsByIndexName(matchRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
    }

    private static String handleGrpcData(GrpcResult grpcResult) {
        Any data = grpcResult.getData();
        try {
            if (data.is(Value.class)) {
                // 解包 Any 对象并获取 Value 消息
                Value value = data.unpack(Value.class);
                if (value.getKindCase() == Value.KindCase.STRING_VALUE) {
                    String jsonString = value.getStringValue();
                    return jsonString;
                }
            }
        } catch (InvalidProtocolBufferException e) {
            e.printStackTrace();
        }
        return null;
    }

    private static void updateDocument() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsDocumentServiceGrpc.EsDocumentServiceBlockingStub blockingStub = EsDocumentServiceGrpc.newBlockingStub(managedChannel);
        String routing = "";
        String id = "698755e33b4b400398f6c51164de928d__5";
        Map<String, Object> objectMap = new HashMap<>();
        objectMap.put("id", id);
        objectMap.put("title", "我爱北京天安门" + DateUtil.now());
        objectMap.put("description", "我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门我爱北京天安门" + DateUtil.now());
        String obj = JSONObject.toJSONString(objectMap);
        DocumentData documentData = DocumentData.newBuilder()
                .setId(id)
                .setIndexName(indexName)
                .setRouting(routing)
                .setObj(obj)
                .build();

        UpdateDocumentequest matchRequest = UpdateDocumentequest.newBuilder()
                .setData(documentData)
                .build();
        GrpcResult grpcResult = blockingStub.updateDocument(matchRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
        try {
            managedChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    private static void saveDocuments() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsDocumentServiceGrpc.EsDocumentServiceBlockingStub blockingStub = EsDocumentServiceGrpc.newBlockingStub(managedChannel);

        List<DocumentData> documentDatas = new ArrayList();
        for (int i = 0; i < 5; i++) {
            String routing = "";
            String id = UuidUtils.getUuid() + "__" + (i + 1);
            Map<String, Object> objectMap = new HashMap<>();
            objectMap.put("id", id);
            objectMap.put("title", (i + 1) + "__" + "我爱北京天安门" + DateUtil.now());
            objectMap.put("description", (i + 1) + "__" + "我爱北京天安门description" + DateUtil.now());
            String obj = JSONObject.toJSONString(objectMap);
            DocumentData documentData = DocumentData.newBuilder()
                    .setId(id)
                    .setIndexName(indexName)
                    .setRouting(routing)
                    .setObj(obj)
                    .build();
            documentDatas.add(documentData);
        }
        BatchSaveDocumentRequest matchRequest = BatchSaveDocumentRequest.newBuilder()
                .addAllData(documentDatas)
                .build();
        GrpcResult grpcResult = blockingStub.batchSaveDocuments(matchRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
        try {
            managedChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }


    private static void saveDocument() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsDocumentServiceGrpc.EsDocumentServiceBlockingStub blockingStub = EsDocumentServiceGrpc.newBlockingStub(managedChannel);
        String routing = "";
        String id = UuidUtils.getUuid();
        Map<String, Object> objectMap = new HashMap<>();
        objectMap.put("id", id);
        objectMap.put("title", "我爱北京天安门" + DateUtil.now());
        objectMap.put("description", "我爱北京天安门description" + DateUtil.now());
        String obj = JSONObject.toJSONString(objectMap);
        DocumentData documentData = DocumentData.newBuilder()
                .setId(id)
                .setIndexName(indexName)
                .setRouting(routing)
                .setObj(obj)
                .build();

        SaveDocumentequest matchRequest = SaveDocumentequest.newBuilder()
                .setData(documentData)
                .build();
        GrpcResult grpcResult = blockingStub.saveDocument(matchRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
        try {
            managedChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    private static void getDocumentById() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsDocumentServiceGrpc.EsDocumentServiceBlockingStub blockingStub = EsDocumentServiceGrpc.newBlockingStub(managedChannel);
        DocumentIdRequest matchRequest = DocumentIdRequest.newBuilder()
                .setIndexName(indexName)
                .setId("8e3c6a630019473b998b9696235f27cb")
                .build();
        GrpcResult grpcResult = blockingStub.getDocumentById(matchRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
        try {
            managedChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    private static void getDocumentByIds() {
        ManagedChannel managedChannel = Grpc.newChannelBuilderForAddress(host, port, InsecureChannelCredentials.create()).build();
        EsDocumentServiceGrpc.EsDocumentServiceBlockingStub blockingStub = EsDocumentServiceGrpc.newBlockingStub(managedChannel);
        List<String> ids = Lists.newArrayList("8e3c6a630019473b998b9696235f27cb", "57164e5ba124450eba031ffb77790ab71");
        DocumentIdsRequest matchRequest = DocumentIdsRequest.newBuilder()
                .setIndexName(indexName)
                .addAllIds(ids)
                .build();
        GrpcResult grpcResult = blockingStub.getDocumentsByIds(matchRequest);
        System.out.println(grpcResult.getCode());
        System.out.println(grpcResult.getMessage());
        String data = handleGrpcData(grpcResult);
        System.out.println(data);
        try {
            managedChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
