package com.moer.search.mcp;

import com.moer.search.mcp.tools.RerankTool;
import com.moer.search.mcp.tools.SearchTool;
import com.moer.search.mcp.tools.SuggestTool;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Moer Search MCP Server 启动类
 * 
 * <p>提供 Model Context Protocol (MCP) 服务，允许 AI Agent 通过标准协议调用搜索能力。
 * MCP 是一种标准化的插件协议，使 AI Agent 能够安全地访问外部工具和数据。
 * 
 * <p>注册的工具：
 * <ul>
 *   <li>SearchTool - 全文搜索工具，支持关键词搜索和复杂查询</li>
 *   <li>SuggestTool - 搜索建议工具，提供搜索词补全和推荐</li>
 *   <li>RerankTool - 结果重排序工具，基于语义相似度重新排序搜索结果</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 * @since 1.0.0
 */
@Slf4j
@SpringBootApplication(scanBasePackages = "com.moer.search.mcp")
public class MoerMcpServer {

    public static void main(String[] args) {
        SpringApplication.run(MoerMcpServer.class, args);
        log.info("Moer Search MCP Server started successfully");
    }

    /**
     * 注册搜索工具
     * 
     * @return SearchTool 实例
     */
    @Bean
    public SearchTool searchTool() {
        return new SearchTool();
    }

    /**
     * 注册搜索建议工具
     * 
     * @return SuggestTool 实例
     */
    @Bean
    public SuggestTool suggestTool() {
        return new SuggestTool();
    }

    /**
     * 注册重排序工具
     * 
     * @return RerankTool 实例
     */
    @Bean
    public RerankTool rerankTool() {
        return new RerankTool();
    }
}
