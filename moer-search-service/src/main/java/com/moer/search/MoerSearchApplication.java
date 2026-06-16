package com.moer.search;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.core.env.Environment;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * MoerSearch 分布式搜索引擎服务启动类
 * 
 * <p>该类是 Spring Boot 应用的入口点，负责启动整个搜索服务。
 * 服务集成了 Elasticsearch 搜索引擎，提供索引管理和文档操作的 RESTful API 以及 gRPC 接口。
 * 
 * <p>主要功能特性：
 * <ul>
 *   <li>索引管理：创建、删除、更新、关闭、开启索引</li>
 *   <li>文档操作：增删改查、批量操作、DSL 查询</li>
 *   <li>索引别名管理：添加、移除别名</li>
 *   <li>支持 RESTful API 和 gRPC 两种访问方式</li>
 *   <li>集成 Knife4j 接口文档</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Slf4j
@EnableAspectJAutoProxy
@SpringBootApplication
public class MoerSearchApplication {

    public static void main(String[] args) throws UnknownHostException {
        SpringApplication app = new SpringApplication(MoerSearchApplication.class);
        Environment env = app.run(args).getEnvironment();
        String protocol = "http";
        if (env.getProperty("server.ssl.key-store") != null) {
            protocol = "https";
        }
        log.info("\n--------------------------------------------------------------------------\n\t" +
                        "分布式搜索引擎MoerSearch服务 '{}' is running !!! \n\t"
                        + "Local Knife4j Url : \t{}://localhost:{}/doc.html\n\t"
                        + "External Knife4j Url : \t{}://{}:{}/doc.html\n\t"
                        + "Elasticsearch Url : \t{}"
               + "\n--------------------------------------------------------------------------\t",
                env.getProperty("spring.application.name"),
                protocol,
                env.getProperty("server.port"),
                protocol,
                InetAddress.getLocalHost().getHostAddress(),
                env.getProperty("server.port")
                ,env.getProperty("spring.elasticsearch.bboss.elasticsearch.rest.hostNames"));
    }
}



