package com.moer.search.ontology.controller;

import com.moer.search.ontology.MoerOntologyEngine;
import com.moer.search.ontology.model.Concept;
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

/**
 * 概念管理控制器
 * 
 * 提供概念的增删改查接口，支持概念搜索和详情查询。
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/concept")
@Api(tags = "概念管理", description = "提供概念的搜索、查询、新增、更新和删除能力")
@RequiredArgsConstructor
public class ConceptController {

    private final MoerOntologyEngine ontologyEngine;

    /**
     * 搜索概念
     */
    @GetMapping("/search")
    @ApiOperation(value = "搜索概念", notes = "根据关键词搜索概念，支持分页")
    public ResponseEntity<Map<String, Object>> search(
            @ApiParam(value = "搜索关键词", required = true) @RequestParam String query,
            @ApiParam(value = "页码", defaultValue = "1") @RequestParam(defaultValue = "1") Integer pageNum,
            @ApiParam(value = "每页大小", defaultValue = "10") @RequestParam(defaultValue = "10") Integer pageSize) {
        
        log.info("Searching concepts with query: {}", query);
        Map<String, Object> result = ontologyEngine.searchConcepts(query, pageNum, pageSize);
        return ResponseEntity.ok(result);
    }

    /**
     * 获取概念详情
     */
    @GetMapping("/{id}")
    @ApiOperation(value = "获取概念详情", notes = "根据概念ID获取详细信息")
    public ResponseEntity<Concept> getById(
            @ApiParam(value = "概念ID", required = true) @PathVariable String id) {
        
        log.info("Getting concept by id: {}", id);
        Concept concept = ontologyEngine.getConcept(id);
        
        if (concept == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(concept);
    }

    /**
     * 获取所有概念
     */
    @GetMapping("/list")
    @ApiOperation(value = "获取所有概念", notes = "获取系统中所有概念")
    public ResponseEntity<List<Concept>> listAll() {
        log.info("Getting all concepts");
        List<Concept> concepts = ontologyEngine.getAllConcepts();
        return ResponseEntity.ok(concepts);
    }

    /**
     * 创建概念
     */
    @PostMapping
    @ApiOperation(value = "创建概念", notes = "创建新的概念")
    public ResponseEntity<Concept> create(
            @ApiParam(value = "概念对象", required = true) @RequestBody Concept concept) {
        
        log.info("Creating concept: {}", concept.getConceptName());
        Concept created = ontologyEngine.addConcept(concept);
        return ResponseEntity.ok(created);
    }

    /**
     * 更新概念
     */
    @PutMapping("/{id}")
    @ApiOperation(value = "更新概念", notes = "更新指定ID的概念")
    public ResponseEntity<Concept> update(
            @ApiParam(value = "概念ID", required = true) @PathVariable String id,
            @ApiParam(value = "更新的概念对象", required = true) @RequestBody Concept concept) {
        
        log.info("Updating concept: {}", id);
        concept.setConceptId(id);
        Concept updated = ontologyEngine.updateConcept(concept);
        
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updated);
    }

    /**
     * 删除概念
     */
    @DeleteMapping("/{id}")
    @ApiOperation(value = "删除概念", notes = "删除指定ID的概念")
    public ResponseEntity<Map<String, Object>> delete(
            @ApiParam(value = "概念ID", required = true) @PathVariable String id) {
        
        log.info("Deleting concept: {}", id);
        boolean deleted = ontologyEngine.deleteConcept(id);
        
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(MapBuilder.of("success", true, "message", "概念删除成功"));
    }

    /**
     * 获取概念的子概念
     */
    @GetMapping("/{id}/children")
    @ApiOperation(value = "获取子概念", notes = "获取指定概念的所有子概念")
    public ResponseEntity<List<Concept>> getChildren(
            @ApiParam(value = "概念ID", required = true) @PathVariable String id) {
        
        log.info("Getting children for concept: {}", id);
        List<Concept> children = ontologyEngine.getChildConcepts(id);
        return ResponseEntity.ok(children);
    }

    /**
     * 获取概念的父概念
     */
    @GetMapping("/{id}/parents")
    @ApiOperation(value = "获取父概念", notes = "获取指定概念的所有父概念")
    public ResponseEntity<List<Concept>> getParents(
            @ApiParam(value = "概念ID", required = true) @PathVariable String id) {
        
        log.info("Getting parents for concept: {}", id);
        List<Concept> parents = ontologyEngine.getParentConcepts(id);
        return ResponseEntity.ok(parents);
    }
}