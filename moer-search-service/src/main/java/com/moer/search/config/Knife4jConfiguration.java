package com.moer.search.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2WebMvc;


/**
 * Knife4j 接口文档配置类
 * 
 * <p>配置 Swagger2 + Knife4j 接口文档生成器，提供 RESTful API 的在线文档和调试功能。
 * 
 * <p>配置内容：
 * <ul>
 *   <li>API 文档标题和描述</li>
 *   <li>扫描指定包路径下的 Controller</li>
 *   <li>生成接口文档分组</li>
 * </ul>
 * 
 * <p>访问地址：
 * <ul>
 *   <li>Swagger UI: http://localhost:8082/swagger-ui.html</li>
 *   <li>Knife4j UI: http://localhost:8082/doc.html</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Configuration
@EnableSwagger2WebMvc
public class Knife4jConfiguration {

    @Bean(value = "defaultApi2")
    public Docket defaultApi2() {
        Docket docket=new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(new ApiInfoBuilder()
                        .title("分布式搜索引擎More Search服务")
                        .description("分布式搜索引擎More Search服务")
                        .termsOfServiceUrl("https://www.moerjiaoyu.com/")
                        .version("1.0.0")
                        .build())
                //分组名称
                .groupName("all")
                .select()
                //这里指定Controller扫描包路径
                .apis(RequestHandlerSelectors.basePackage("com.moer.search.controller"))
                .paths(PathSelectors.any())
                .build();
        return docket;
    }
}
