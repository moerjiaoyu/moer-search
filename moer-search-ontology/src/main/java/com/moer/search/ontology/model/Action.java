package com.moer.search.ontology.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 动作模型类
 * 
 * 表示本体中的动作/操作定义，类似AIP（Action Intent Processing）中的动作意图。
 * 
 * <p>动作是可以被执行的操作，包含触发条件、执行逻辑和输出定义。
 * 
 * <p>核心属性：
 * <ul>
 *   <li>actionId - 动作唯一标识符</li>
 *   <li>actionName - 动作名称</li>
 *   <li>actionType - 动作类型（QUERY, COMMAND, EVENT, WORKFLOW）</li>
 *   <li>description - 动作描述</li>
 *   <li>trigger - 触发条件</li>
 *   <li>inputSchema - 输入参数定义</li>
 *   <li>outputSchema - 输出结果定义</li>
 *   <li>toolName - 关联的工具名称</li>
 *   <li>toolMethod - 工具方法名</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Action {

    /** 动作类型枚举 */
    public enum ActionType {
        /** 查询动作 - 用于获取信息 */
        QUERY,
        /** 命令动作 - 用于执行操作 */
        COMMAND,
        /** 事件动作 - 用于响应事件 */
        EVENT,
        /** 工作流动作 - 用于编排多个动作 */
        WORKFLOW
    }

    /** 动作唯一标识符 */
    private String actionId;

    /** 动作名称 */
    private String actionName;

    /** 动作名称（英文） */
    private String actionNameEn;

    /** 动作类型 */
    private ActionType actionType;

    /** 动作描述 */
    private String description;

    /** 所属领域/上下文 */
    private String domain;

    /** 触发条件（支持表达式） */
    private String trigger;

    /** 关联的概念ID（可选） */
    private String conceptId;

    /** 关联的工具名称 */
    private String toolName;

    /** 工具方法名 */
    private String toolMethod;

    /** 输入参数列表 */
    @Builder.Default
    private List<Parameter> inputParams = new ArrayList<>();

    /** 输出参数列表 */
    @Builder.Default
    private List<Parameter> outputParams = new ArrayList<>();

    /** 执行模板（用于生成工具调用） */
    private String executionTemplate;

    /** 前置条件表达式 */
    private String preCondition;

    /** 后置条件表达式 */
    private String postCondition;

    /** 置信度阈值 */
    private Double confidenceThreshold;

    /** 是否启用 */
    @Builder.Default
    private Boolean enabled = true;

    /** 优先级（数字越小优先级越高） */
    @Builder.Default
    private Integer priority = 100;

    /** 同义词/别名列表 */
    @Builder.Default
    private List<String> synonyms = new ArrayList<>();

    /** 示例查询 */
    @Builder.Default
    private List<String> examples = new ArrayList<>();

    /** 扩展属性 */
    @Builder.Default
    private Map<String, Object> extensions = new HashMap<>();

    /** 创建时间戳 */
    private Long createTime;

    /** 更新时间戳 */
    private Long updateTime;

    /**
     * 参数定义类
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Parameter {
        /** 参数名称 */
        private String name;
        
        /** 参数显示名称 */
        private String displayName;
        
        /** 参数类型（string, integer, number, boolean, array, object） */
        private String type;
        
        /** 是否必填 */
        @Builder.Default
        private Boolean required = false;
        
        /** 默认值 */
        private Object defaultValue;
        
        /** 参数描述 */
        private String description;
        
        /** 可选值列表 */
        @Builder.Default
        private List<Object> enumValues = new ArrayList<>();
        
        /** 验证规则 */
        private String validationRule;
        
        /** 是否为数组 */
        @Builder.Default
        private Boolean isArray = false;
    }

    /**
     * 添加输入参数
     */
    public void addInputParam(Parameter param) {
        if (inputParams == null) {
            inputParams = new ArrayList<>();
        }
        inputParams.add(param);
    }

    /**
     * 添加输出参数
     */
    public void addOutputParam(Parameter param) {
        if (outputParams == null) {
            outputParams = new ArrayList<>();
        }
        outputParams.add(param);
    }

    /**
     * 添加同义词
     */
    public void addSynonym(String synonym) {
        if (synonyms == null) {
            synonyms = new ArrayList<>();
        }
        if (!synonyms.contains(synonym)) {
            synonyms.add(synonym);
        }
    }

    /**
     * 添加示例
     */
    public void addExample(String example) {
        if (examples == null) {
            examples = new ArrayList<>();
        }
        examples.add(example);
    }

    /**
     * 设置扩展属性
     */
    public void setExtension(String key, Object value) {
        if (extensions == null) {
            extensions = new HashMap<>();
        }
        extensions.put(key, value);
    }

    /**
     * 获取扩展属性
     */
    public Object getExtension(String key) {
        return extensions != null ? extensions.get(key) : null;
    }
}
