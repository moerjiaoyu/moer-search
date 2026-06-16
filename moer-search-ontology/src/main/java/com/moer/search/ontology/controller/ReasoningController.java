package com.moer.search.ontology.controller;

import com.moer.search.ontology.MoerOntologyEngine;
import com.moer.search.ontology.util.MapBuilder;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 推理服务控制器
 * 
 * 提供子类推理、传递推理、规则推理和查询扩展能力。
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/reason")
@Api(tags = "推理服务", description = "提供子类推理、传递推理、规则推理和查询扩展能力")
@RequiredArgsConstructor
public class ReasoningController {

    private final MoerOntologyEngine ontologyEngine;

    /**
     * 获取子类
     */
    @GetMapping("/subclass")
    @ApiOperation(value = "子类推理", notes = "获取指定概念的所有子类")
    public ResponseEntity<Map<String, Object>> getSubclasses(
            @ApiParam(value = "概念ID", required = true) @RequestParam String conceptId,
            @ApiParam(value = "是否递归获取所有后代", defaultValue = "true") @RequestParam(defaultValue = "true") Boolean recursive) {
        
        log.info("Getting subclasses for concept: {}, recursive: {}", conceptId, recursive);
        
        Set<String> subclasses;
        if (recursive) {
            subclasses = ontologyEngine.getSubclasses(conceptId);
        } else {
            subclasses = ontologyEngine.getDirectSubclasses(conceptId);
        }
        
        return ResponseEntity.ok(MapBuilder.of(
            "conceptId", conceptId,
            "recursive", recursive,
            "subclasses", subclasses,
            "count", subclasses.size()
        ));
    }

    /**
     * 获取父类
     */
    @GetMapping("/superclass")
    @ApiOperation(value = "父类推理", notes = "获取指定概念的所有父类")
    public ResponseEntity<Map<String, Object>> getSuperclasses(
            @ApiParam(value = "概念ID", required = true) @RequestParam String conceptId,
            @ApiParam(value = "是否递归获取所有祖先", defaultValue = "true") @RequestParam(defaultValue = "true") Boolean recursive) {
        
        log.info("Getting superclasses for concept: {}, recursive: {}", conceptId, recursive);
        
        Set<String> superclasses;
        if (recursive) {
            superclasses = ontologyEngine.getSuperclasses(conceptId);
        } else {
            superclasses = ontologyEngine.getDirectSuperclasses(conceptId);
        }
        
        return ResponseEntity.ok(MapBuilder.of(
            "conceptId", conceptId,
            "recursive", recursive,
            "superclasses", superclasses,
            "count", superclasses.size()
        ));
    }

    /**
     * 判断继承关系
     */
    @GetMapping("/is-subclass")
    @ApiOperation(value = "判断继承关系", notes = "判断一个概念是否是另一个概念的子类")
    public ResponseEntity<Map<String, Object>> isSubclass(
            @ApiParam(value = "子概念ID", required = true) @RequestParam String subConceptId,
            @ApiParam(value = "父概念ID", required = true) @RequestParam String superConceptId) {
        
        log.info("Checking if {} is subclass of {}", subConceptId, superConceptId);
        boolean result = ontologyEngine.isSubclass(subConceptId, superConceptId);
        
        return ResponseEntity.ok(MapBuilder.of(
            "subConceptId", subConceptId,
            "superConceptId", superConceptId,
            "isSubclass", result
        ));
    }

    /**
     * 查询扩展
     */
    @GetMapping("/expand")
    @ApiOperation(value = "查询扩展", notes = "对查询词进行语义扩展，支持同义词、语义和概念扩展")
    public ResponseEntity<Map<String, Object>> expandQuery(
            @ApiParam(value = "原始查询词", required = true) @RequestParam String query,
            @ApiParam(value = "扩展类型", defaultValue = "synonym") @RequestParam(defaultValue = "synonym") String expandType) {
        
        log.info("Expanding query: {}, type: {}", query, expandType);
        List<String> expandedTerms = ontologyEngine.expandQuery(query, expandType);
        
        return ResponseEntity.ok(MapBuilder.of(
            "originalQuery", query,
            "expandType", expandType,
            "expandedTerms", expandedTerms,
            "count", expandedTerms.size()
        ));
    }

    /**
     * 规则推理
     */
    @PostMapping("/rule")
    @ApiOperation(value = "规则推理", notes = "基于规则引擎进行推理")
    public ResponseEntity<Map<String, Object>> ruleReasoning(
            @ApiParam(value = "输入数据", required = true) @RequestBody Map<String, Object> input) {
        
        log.info("Performing rule reasoning with input: {}", input);
        List<Map<String, Object>> results = ontologyEngine.applyRules(input);
        
        return ResponseEntity.ok(MapBuilder.of(
            "input", input,
            "results", results,
            "count", results.size()
        ));
    }

    /**
     * 获取传递闭包
     */
    @GetMapping("/transitive")
    @ApiOperation(value = "传递推理", notes = "获取指定概念的传递闭包")
    public ResponseEntity<Map<String, Object>> getTransitiveClosure(
            @ApiParam(value = "概念ID", required = true) @RequestParam String conceptId,
            @ApiParam(value = "关系类型", defaultValue = "is_a") @RequestParam(defaultValue = "is_a") String relationType) {
        
        log.info("Getting transitive closure for concept: {}, relation: {}", conceptId, relationType);
        Set<String> closure = ontologyEngine.getTransitiveClosure(conceptId, relationType);
        
        return ResponseEntity.ok(MapBuilder.of(
            "conceptId", conceptId,
            "relationType", relationType,
            "closure", closure,
            "count", closure.size()
        ));
    }

    /**
     * 路径查找
     */
    @GetMapping("/path")
    @ApiOperation(value = "路径查找", notes = "查找两个概念之间的路径")
    public ResponseEntity<Map<String, Object>> findPath(
            @ApiParam(value = "源概念ID", required = true) @RequestParam String sourceId,
            @ApiParam(value = "目标概念ID", required = true) @RequestParam String targetId) {
        
        log.info("Finding path from {} to {}", sourceId, targetId);
        List<List<String>> paths = ontologyEngine.findPath(sourceId, targetId);
        
        return ResponseEntity.ok(MapBuilder.of(
            "sourceId", sourceId,
            "targetId", targetId,
            "paths", paths,
            "count", paths.size()
        ));
    }
}