package com.moer.search.utils;

import com.google.protobuf.Message;
import com.google.protobuf.util.JsonFormat;

import java.io.IOException;

/**
 * protobuf bean 转换工具类
 */
public class ProtobufBeanUtil {

    private ProtobufBeanUtil(){
    }

    /**
     * 将ProtoBean对象转化为POJO对象
     *
     * @param destPojoClass 目标POJO对象的类类型
     * @param sourceMessage 含有数据的ProtoBean对象实例
     * @param <PojoType> 目标POJO对象的类类型范型
     * @return
     * @throws IOException
     */
    public static <PojoType> PojoType toPojoBean(Class<PojoType> destPojoClass, Message sourceMessage)
            throws IOException {
        String json = JsonFormat.printer().print(sourceMessage);
        return JsonUtils.parseObject(json, destPojoClass);
    }

    /**
     * 将POJO对象转化为ProtoBean对象
     *
     * @param destBuilder 目标Message对象的Builder类
     * @param sourcePojoBean 含有数据的POJO对象
     * @return
     * @throws IOException
     */
    public static void toProtoBean(Message.Builder destBuilder, Object sourcePojoBean) throws IOException {
        // 创建 ObjectMapper 实例，并注册模块
        String json = JsonUtils.toJsonString(sourcePojoBean);
        JsonFormat.parser().ignoringUnknownFields().merge(json, destBuilder);
    }


}
