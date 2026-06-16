package com.moer.search.ontology.reasoner;

import com.moer.search.ontology.model.Concept;
import com.moer.search.ontology.model.Relation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 规则推理器
 * 
 * 负责基于规则进行自动推理，支持自定义规则和默认规则。
 * 
 * <p>核心功能：
 * <ul>
 *   <li>初始化默认推理规则</li>
 *   <li>添加自定义规则</li>
 *   <li>执行规则推理</li>
 *   <li>针对特定概念进行推理</li>
 * </ul>
 * 
 * <p>内置规则：
 * <ul>
 *   <li>传递属性规则 - 如果 A rel B 且 B rel C，则 A rel C</li>
 *   <li>反向关系规则 - 自动推断反向关系</li>
 *   <li>子类继承规则 - 子类继承父类的属性</li>
 *   <li>部分-整体传递规则 - 部分的部分也是整体的部分</li>
 *   <li>实例分类规则 - 实例属于父类的所有祖先</li>
 * </ul>
 * 
 * @author moer
 * @version 1.0.0
 */
@Slf4j
@Component
public class RuleReasoner {

    /** 规则列表 */
    private final List<Rule> rules = new ArrayList<>();

    /** 概念知识库 */
    private final Map<String, Concept> conceptMap = new HashMap<>();

    /** 关系知识库 */
    private final Map<String, Relation> relationMap = new HashMap<>();

    /**
     * 规则动作接口
     */
    @FunctionalInterface
    public interface RuleAction {
        /**
         * 执行规则动作
         * 
         * @param bindings 绑定的变量
         * @param results 推断结果收集器
         */
        void execute(Map<String, String> bindings, List<InferredRelation> results);
    }

    /**
     * 规则类
     */
    public static class Rule {
        private final String name;
        private final Pattern pattern;
        private final RuleAction action;

        /**
         * 创建规则
         * 
         * @param name 规则名称
         * @param pattern 规则模式
         * @param action 规则动作
         */
        public Rule(String name, Pattern pattern, RuleAction action) {
            this.name = name;
            this.pattern = pattern;
            this.action = action;
        }

        public String getName() { return name; }
        public Pattern getPattern() { return pattern; }
        public RuleAction getAction() { return action; }
    }

    /**
     * 推断关系类
     */
    public static class InferredRelation {
        private final String sourceId;
        private final String targetId;
        private final String relationType;
        private final String ruleName;

        /**
         * 创建推断关系
         * 
         * @param sourceId 源概念ID
         * @param targetId 目标概念ID
         * @param relationType 关系类型
         * @param ruleName 推断规则名称
         */
        public InferredRelation(String sourceId, String targetId, String relationType, String ruleName) {
            this.sourceId = sourceId;
            this.targetId = targetId;
            this.relationType = relationType;
            this.ruleName = ruleName;
        }

        public String getSourceId() { return sourceId; }
        public String getTargetId() { return targetId; }
        public String getRelationType() { return relationType; }
        public String getRuleName() { return ruleName; }
        
        /**
         * 获取置信度
         * 
         * @return 置信度值（默认1.0）
         */
        public double getConfidence() {
            return 1.0;
        }
    }

    /**
     * 初始化默认规则
     * 
     * 加载内置的推理规则，包括：
     * <ul>
     *   <li>传递属性规则</li>
     *   <li>反向关系规则</li>
     *   <li>子类继承规则</li>
     *   <li>部分-整体传递规则</li>
     *   <li>实例分类规则</li>
     * </ul>
     */
    public void initializeDefaultRules() {
        rules.clear();

        rules.add(new Rule("Transitive Property", 
            Pattern.compile("(\\w+) (\\w+) (\\w+) AND (\\w+) (\\w+) (\\w+)"),
            (bindings, results) -> {
                String a = bindings.get("1");
                String rel = bindings.get("2");
                String b = bindings.get("3");
                String c = bindings.get("6");

                if (b.equals(bindings.get("4")) && rel.equals(bindings.get("5"))) {
                    results.add(new InferredRelation(a, c, rel, "Transitive Property"));
                }
            }));

        rules.add(new Rule("Inverse Relation",
            Pattern.compile("(\\w+) (\\w+) (\\w+)"),
            (bindings, results) -> {
                String source = bindings.get("1");
                String relType = bindings.get("2");
                String target = bindings.get("3");

                String inverseType = getInverseRelationType(relType);
                if (inverseType != null) {
                    results.add(new InferredRelation(target, source, inverseType, "Inverse Relation"));
                }
            }));

        rules.add(new Rule("Subclass Inheritance",
            Pattern.compile("(\\w+) is_a (\\w+) AND (\\w+) has_a (\\w+)"),
            (bindings, results) -> {
                String subClass = bindings.get("1");
                String superClass = bindings.get("2");
                String property = bindings.get("4");

                results.add(new InferredRelation(subClass, property, Relation.TYPE_HAS_A, "Subclass Inheritance"));
            }));

        rules.add(new Rule("Part-Whole Transitivity",
            Pattern.compile("(\\w+) part_of (\\w+) AND (\\w+) part_of (\\w+)"),
            (bindings, results) -> {
                String a = bindings.get("1");
                String b = bindings.get("2");
                String d = bindings.get("4");

                if (b.equals(bindings.get("3"))) {
                    results.add(new InferredRelation(a, d, Relation.TYPE_PART_OF, "Part-Whole Transitivity"));
                }
            }));

        rules.add(new Rule("Instance Classification",
            Pattern.compile("(\\w+) instance_of (\\w+) AND (\\w+) is_a (\\w+)"),
            (bindings, results) -> {
                String instance = bindings.get("1");
                String concept = bindings.get("2");
                String superConcept = bindings.get("4");

                if (concept.equals(bindings.get("3"))) {
                    results.add(new InferredRelation(instance, superConcept, Relation.TYPE_INSTANCE_OF, "Instance Classification"));
                }
            }));

        log.info("Default rules initialized: {}", rules.size());
    }

    /**
     * 添加自定义规则
     * 
     * @param name 规则名称
     * @param patternStr 规则模式字符串
     * @param action 规则动作
     */
    public void addCustomRule(String name, String patternStr, RuleAction action) {
        Pattern pattern = Pattern.compile(patternStr);
        rules.add(new Rule(name, pattern, action));
        log.info("Custom rule added: {}", name);
    }

    /**
     * 更新知识库
     * 
     * @param concepts 概念映射
     * @param relations 关系映射
     */
    public void updateKnowledgeBase(Map<String, Concept> concepts, Map<String, Relation> relations) {
        this.conceptMap.clear();
        this.conceptMap.putAll(concepts);
        this.relationMap.clear();
        this.relationMap.putAll(relations);
    }

    /**
     * 执行所有规则推理
     * 
     * 使用不动点迭代算法，直到不再产生新的推断结果。
     * 
     * @return 所有推断出的关系列表
     */
    public List<InferredRelation> inferAll() {
        Set<InferredRelation> results = new HashSet<>();
        boolean changed = true;
        int iterations = 0;
        int maxIterations = 100;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            for (Rule rule : rules) {
                List<InferredRelation> inferred = applyRule(rule);
                for (InferredRelation inf : inferred) {
                    if (!results.contains(inf)) {
                        results.add(inf);
                        changed = true;
                    }
                }
            }
        }

        log.info("推理完成，共推断出 {} 条关系，迭代 {} 次", results.size(), iterations);
        return new ArrayList<>(results);
    }

    /**
     * 应用单条规则
     * 
     * @param rule 规则对象
     * @return 推断出的关系列表
     */
    public List<InferredRelation> applyRule(Rule rule) {
        List<InferredRelation> results = new ArrayList<>();
        List<String> facts = generateFacts();

        for (String fact : facts) {
            Matcher matcher = rule.getPattern().matcher(fact);
            if (matcher.matches()) {
                Map<String, String> bindings = new HashMap<>();
                for (int i = 1; i <= matcher.groupCount(); i++) {
                    bindings.put(String.valueOf(i), matcher.group(i));
                }
                rule.getAction().execute(bindings, results);
            }
        }

        return results;
    }

    /**
     * 生成事实列表
     * 
     * 将知识库中的概念和关系转换为字符串格式的事实。
     * 
     * @return 事实字符串列表
     */
    private List<String> generateFacts() {
        List<String> facts = new ArrayList<>();

        for (Relation relation : relationMap.values()) {
            facts.add(String.format("%s %s %s",
                relation.getSourceConceptId(),
                relation.getRelationType(),
                relation.getTargetConceptId()));
        }

        for (Concept concept : conceptMap.values()) {
            if (concept.getParents() != null) {
                for (String parent : concept.getParents()) {
                    facts.add(String.format("%s %s %s",
                        concept.getConceptId(),
                        Relation.TYPE_IS_A,
                        parent));
                }
            }
        }

        return facts;
    }

    /**
     * 获取反向关系类型
     * 
     * @param relationType 关系类型
     * @return 反向关系类型，如果不存在返回null
     */
    private String getInverseRelationType(String relationType) {
        if (relationType == null) {
            return null;
        }
        switch (relationType) {
            case Relation.TYPE_PART_OF:
                return Relation.TYPE_CONTAINS;
            case Relation.TYPE_CONTAINS:
                return Relation.TYPE_PART_OF;
            case Relation.TYPE_HAS_A:
                return Relation.TYPE_INSTANCE_OF;
            case Relation.TYPE_INSTANCE_OF:
                return Relation.TYPE_HAS_A;
            case Relation.TYPE_CAUSES:
                return Relation.TYPE_TREATMENT_FOR;
            case Relation.TYPE_TREATMENT_FOR:
                return Relation.TYPE_CAUSES;
            default:
                return null;
        }
    }

    /**
     * 针对特定概念执行规则推理
     * 
     * @param conceptId 概念ID
     * @return 推断出的与该概念相关的关系列表
     */
    public List<InferredRelation> inferFromConcept(String conceptId) {
        List<InferredRelation> allInferences = inferAll();
        return allInferences.stream()
            .filter(inf -> inf.getSourceId().equals(conceptId) || inf.getTargetId().equals(conceptId))
            .collect(Collectors.toList());
    }

    /**
     * 获取所有规则
     * 
     * @return 规则列表
     */
    public List<Rule> getRules() {
        return new ArrayList<>(rules);
    }

    /**
     * 清空规则
     */
    public void clearRules() {
        rules.clear();
    }

    /**
     * 获取规则数量
     * 
     * @return 规则数量
     */
    public int getRuleCount() {
        return rules.size();
    }
}