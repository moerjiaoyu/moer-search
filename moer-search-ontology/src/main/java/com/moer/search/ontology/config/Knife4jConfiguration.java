package com.moer.search.ontology.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.service.Contact;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2WebMvc;

/**
 * Knife4j (Swagger) 配置类
 * 
 * 配置 API 文档生成器，提供交互式 API 文档界面。
 * 
 * @author moer
 * @version 1.0.0
 */
@Configuration
@EnableSwagger2WebMvc
public class Knife4jConfiguration {

    @Bean
    public Docket api() {
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(apiInfo())
                .select()
                .apis(RequestHandlerSelectors.basePackage("com.moer.search.ontology.controller"))
                .paths(PathSelectors.any())
                .build();
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
                .title("Moer Search Ontology API")
                .description("本体引擎服务接口文档 - 提供概念搜索、推理和查询扩展能力")
                .version("1.0.0")
                .contact(new Contact("Moer Search", "https://gitee.com/moerjiaoyu/moer-search", "moer@example.com"))
                .build();
    }
}