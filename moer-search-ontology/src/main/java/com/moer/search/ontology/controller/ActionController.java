package com.moer.search.ontology.controller;

import com.moer.search.ontology.model.Action;
import com.moer.search.ontology.storage.OntologyStore;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 动作管理控制器
 * 
 * <p>提供动作(Action)的增删改查操作接口，类似AIP（Action Intent Processing）的动作意图管理。
 * 
 * <p>主要功能：
 * <ul>
 *   <li>动作管理：创建、更新、删除、查询动作</li>
 *   <li>动作搜索：支持按关键词搜索动作</li>
 *   <li>动作分类：按类型、领域、概念筛选动作</li>
 *   <li>动作执行：获取动作定义用于执行</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Api(tags = "动作管理")
@RequestMapping("/api/action")
@RestController
@RequiredArgsConstructor
public class ActionController {

    private final OntologyStore ontologyStore;

    /**
     * 获取所有动作
     * 
     * @return 动作列表
     */
    @ApiOperation(value = "获取所有动作")
    @GetMapping("/list")
    public ResponseEntity<List<Action>> getAllActions() {
        List<Action> actions = ontologyStore.getAllActions();
        return ResponseEntity.ok(actions);
    }

    /**
     * 获取启用的动作
     * 
     * @return 启用的动作列表
     */
    @ApiOperation(value = "获取启用的动作")
    @GetMapping("/enabled")
    public ResponseEntity<List<Action>> getEnabledActions() {
        List<Action> actions = ontologyStore.getEnabledActions();
        return ResponseEntity.ok(actions);
    }

    /**
     * 根据ID获取动作
     * 
     * @param actionId 动作ID
     * @return 动作对象
     */
    @ApiOperation(value = "根据ID获取动作")
    @GetMapping("/{actionId}")
    public ResponseEntity<Action> getActionById(@PathVariable String actionId) {
        Action action = ontologyStore.getAction(actionId);
        if (action == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(action);
    }

    /**
     * 创建动作
     * 
     * @param action 动作对象
     * @return 创建的动作
     */
    @ApiOperation(value = "创建动作")
    @PostMapping
    public ResponseEntity<Action> createAction(@RequestBody Action action) {
        if (action.getActionId() == null || action.getActionId().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        ontologyStore.saveAction(action);
        return ResponseEntity.ok(action);
    }

    /**
     * 更新动作
     * 
     * @param actionId 动作ID
     * @param action   更新的动作对象
     * @return 更新后的动作
     */
    @ApiOperation(value = "更新动作")
    @PutMapping("/{actionId}")
    public ResponseEntity<Action> updateAction(
            @PathVariable String actionId,
            @RequestBody Action action) {
        Action existing = ontologyStore.getAction(actionId);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        action.setActionId(actionId);
        ontologyStore.saveAction(action);
        return ResponseEntity.ok(action);
    }

    /**
     * 删除动作
     * 
     * @param actionId 动作ID
     * @return 删除结果
     */
    @ApiOperation(value = "删除动作")
    @DeleteMapping("/{actionId}")
    public ResponseEntity<Void> deleteAction(@PathVariable String actionId) {
        ontologyStore.deleteAction(actionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 搜索动作
     * 
     * @param query 搜索关键词
     * @return 匹配的动作列表
     */
    @ApiOperation(value = "搜索动作")
    @GetMapping("/search")
    public ResponseEntity<List<Action>> searchActions(@RequestParam String query) {
        List<Action> actions = ontologyStore.searchActions(query);
        return ResponseEntity.ok(actions);
    }

    /**
     * 根据类型获取动作
     * 
     * @param actionType 动作类型（QUERY, COMMAND, EVENT, WORKFLOW）
     * @return 动作列表
     */
    @ApiOperation(value = "根据类型获取动作")
    @GetMapping("/type/{actionType}")
    public ResponseEntity<List<Action>> getActionsByType(@PathVariable String actionType) {
        try {
            Action.ActionType type = Action.ActionType.valueOf(actionType.toUpperCase());
            List<Action> actions = ontologyStore.getActionsByType(type);
            return ResponseEntity.ok(actions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 根据领域获取动作
     * 
     * @param domain 领域名称
     * @return 动作列表
     */
    @ApiOperation(value = "根据领域获取动作")
    @GetMapping("/domain/{domain}")
    public ResponseEntity<List<Action>> getActionsByDomain(@PathVariable String domain) {
        List<Action> actions = ontologyStore.getActionsByDomain(domain);
        return ResponseEntity.ok(actions);
    }

    /**
     * 根据概念获取动作
     * 
     * @param conceptId 概念ID
     * @return 动作列表
     */
    @ApiOperation(value = "根据概念获取动作")
    @GetMapping("/concept/{conceptId}")
    public ResponseEntity<List<Action>> getActionsByConcept(@PathVariable String conceptId) {
        List<Action> actions = ontologyStore.getActionsByConcept(conceptId);
        return ResponseEntity.ok(actions);
    }

    /**
     * 获取动作统计
     * 
     * @return 统计信息
     */
    @ApiOperation(value = "获取动作统计")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getActionStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", ontologyStore.getActionCount());
        stats.put("enabled", ontologyStore.getEnabledActions().size());
        return ResponseEntity.ok(stats);
    }

    /**
     * 批量创建动作
     * 
     * @param actions 动作列表
     * @return 创建结果
     */
    @ApiOperation(value = "批量创建动作")
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> batchCreateActions(@RequestBody List<Action> actions) {
        ontologyStore.saveActions(actions);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("count", actions.size());
        return ResponseEntity.ok(result);
    }
}
