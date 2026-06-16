package com.moer.search.ontology;

import com.moer.search.ontology.config.OntologyIndexProperties;
import com.moer.search.ontology.index.OntologyIndexManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Moer Search Ontology Application - 本体引擎启动类
 * 
 * 提供概念推理和语义扩展能力，支持知识图谱的构建和推理。
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@SpringBootApplication(scanBasePackages = "com.moer.search.ontology")
@EnableConfigurationProperties(OntologyIndexProperties.class)
@RequiredArgsConstructor
public class MoerOntologyApplication implements CommandLineRunner {

    private final MoerOntologyEngine ontologyEngine;
    private final OntologyIndexManager indexManager;

    public static void main(String[] args) throws UnknownHostException {
        SpringApplication.run(MoerOntologyApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Initializing Moer Ontology Engine...");

        Map<String, Object> stats = ontologyEngine.getStatistics();
        log.info("Ontology Statistics:");
        log.info("  - Concepts: {}", stats.get("conceptCount"));
        log.info("  - Relations: {}", stats.get("relationCount"));
        log.info("  - Instances: {}", stats.get("instanceCount"));
        log.info("  - Rules: {}", stats.get("ruleCount"));

        testReasoning();

        printStartupInfo();
    }

    private void testReasoning() {
        log.info("\n--- Testing Reasoning Capabilities ---");

        Set<String> subclasses = ontologyEngine.getSubclasses("entity");
        log.info("Subclasses of 'entity': {}", subclasses);

        boolean isSubclass = ontologyEngine.isSubclass("document", "root");
        log.info("Is 'document' a subclass of 'root'? {}", isSubclass);

        List<com.moer.search.ontology.reasoner.RuleReasoner.InferredRelation> inferences = 
            ontologyEngine.inferRelations();
        log.info("Inferred relations count: {}", inferences.size());
    }

    private void printStartupInfo() throws UnknownHostException {
        InetAddress localhost = InetAddress.getLocalHost();
        
        String line = createRepeatedString('=', 80);
        log.info("\n{}", line);
        log.info("        本体引擎 MoerOntologyEngine 启动成功 !!!");
        log.info("        Local Address:     http://localhost:8084");
        log.info("        External Address:  http://{}:8084", localhost.getHostAddress());
        log.info("        Elasticsearch:     localhost:9200");
        log.info("{}", line);
    }

    private String createRepeatedString(char c, int count) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) {
            sb.append(c);
        }
        return sb.toString();
    }
}