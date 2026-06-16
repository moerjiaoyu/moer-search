package com.moer.search.ontology.integration;

import com.moer.search.ontology.MoerOntologyEngine;
import com.moer.search.ontology.model.Concept;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class QueryExpander {

    private final MoerOntologyEngine ontologyEngine;

    public ExpandedQuery expandQuery(String originalQuery) {
        if (originalQuery == null || originalQuery.isEmpty()) {
            return new ExpandedQuery(originalQuery, Collections.emptyList(), Collections.emptyList());
        }

        List<String> expandedTerms = new ArrayList<>();
        List<String> conceptTags = new ArrayList<>();

        String[] tokens = tokenizeQuery(originalQuery);
        
        for (String token : tokens) {
            List<Concept> matchedConcepts = ontologyEngine.searchConcepts(token);
            
            for (Concept concept : matchedConcepts) {
                expandedTerms.add(concept.getConceptName());
                if (concept.getConceptNameEn() != null) {
                    expandedTerms.add(concept.getConceptNameEn());
                }
                
                if (concept.getSynonyms() != null) {
                    expandedTerms.addAll(concept.getSynonyms());
                }
                
                conceptTags.add(concept.getConceptId());
                
                Set<String> subclasses = ontologyEngine.getSubclasses(concept.getConceptId());
                for (String subclassId : subclasses) {
                    Concept subclass = ontologyEngine.getConcept(subclassId);
                    if (subclass != null) {
                        expandedTerms.add(subclass.getConceptName());
                        conceptTags.add(subclassId);
                    }
                }
            }
        }

        List<String> distinctTerms = new ArrayList<>(new LinkedHashSet<>(expandedTerms));
        List<String> distinctTags = new ArrayList<>(new LinkedHashSet<>(conceptTags));

        log.debug("Query expanded: '{}' -> {} terms, {} tags", 
            originalQuery, distinctTerms.size(), distinctTags.size());

        return new ExpandedQuery(originalQuery, distinctTerms, distinctTags);
    }

    public String buildExpandedQueryString(String originalQuery) {
        ExpandedQuery expanded = expandQuery(originalQuery);
        
        if (expanded.getExpandedTerms().isEmpty()) {
            return originalQuery;
        }

        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append("(").append(originalQuery).append(")");

        if (!expanded.getExpandedTerms().isEmpty()) {
            queryBuilder.append(" OR (");
            queryBuilder.append(String.join(" OR ", expanded.getExpandedTerms()));
            queryBuilder.append(")");
        }

        return queryBuilder.toString();
    }

    public Map<String, Object> buildQueryDsl(String originalQuery, String indexName) {
        ExpandedQuery expanded = expandQuery(originalQuery);
        
        Map<String, Object> query = new HashMap<>();
        List<Map<String, Object>> shouldClauses = new ArrayList<>();

        Map<String, Object> originalClause = new HashMap<>();
        Map<String, Object> matchMap = new HashMap<>();
        matchMap.put("content", originalQuery);
        originalClause.put("match", matchMap);
        shouldClauses.add(originalClause);

        if (!expanded.getExpandedTerms().isEmpty()) {
            for (String term : expanded.getExpandedTerms()) {
                Map<String, Object> termClause = new HashMap<>();
                Map<String, Object> termMatch = new HashMap<>();
                Map<String, Object> termParams = new HashMap<>();
                termParams.put("query", term);
                termParams.put("boost", 0.8);
                termMatch.put("content", termParams);
                termClause.put("match", termMatch);
                shouldClauses.add(termClause);
            }
        }

        Map<String, Object> boolQuery = new HashMap<>();
        boolQuery.put("should", shouldClauses);
        boolQuery.put("minimum_should_match", 1);
        boolQuery.put("boost", 1.0);

        query.put("query", boolQuery);

        if (!expanded.getConceptTags().isEmpty()) {
            Map<String, Object> filterClause = new HashMap<>();
            Map<String, Object> termsMap = new HashMap<>();
            termsMap.put("concept_tags", expanded.getConceptTags());
            filterClause.put("terms", termsMap);
            boolQuery.put("filter", filterClause);
        }

        return query;
    }

    public List<String> extractConceptTags(String query) {
        if (query == null || query.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> tags = new ArrayList<>();
        String[] tokens = tokenizeQuery(query);

        for (String token : tokens) {
            List<Concept> concepts = ontologyEngine.searchConcepts(token);
            for (Concept concept : concepts) {
                tags.add(concept.getConceptId());
                
                Set<String> subclasses = ontologyEngine.getSubclasses(concept.getConceptId());
                tags.addAll(subclasses);
            }
        }

        return new ArrayList<>(new LinkedHashSet<>(tags));
    }

    public List<String> suggestRelatedQueries(String originalQuery, int limit) {
        ExpandedQuery expanded = expandQuery(originalQuery);
        Set<String> suggestions = new LinkedHashSet<>();

        for (String tag : expanded.getConceptTags()) {
            Concept concept = ontologyEngine.getConcept(tag);
            if (concept != null) {
                suggestions.add(concept.getConceptName());
                
                Set<String> related = ontologyEngine.getRelatedConcepts(tag, null);
                for (String relatedId : related) {
                    Concept relatedConcept = ontologyEngine.getConcept(relatedId);
                    if (relatedConcept != null) {
                        suggestions.add(relatedConcept.getConceptName());
                    }
                }
            }
        }

        suggestions.remove(originalQuery);
        
        List<String> result = new ArrayList<>(suggestions);
        if (result.size() > limit) {
            result = result.subList(0, limit);
        }
        return result;
    }

    public String enrichDocumentWithOntology(String documentContent) {
        if (documentContent == null || documentContent.isEmpty()) {
            return documentContent;
        }

        ExpandedQuery expanded = expandQuery(documentContent);
        List<String> tags = expanded.getConceptTags();

        if (tags.isEmpty()) {
            return documentContent;
        }

        StringBuilder enriched = new StringBuilder(documentContent);
        enriched.append(" ");
        enriched.append(String.join(" ", tags));

        return enriched.toString();
    }

    private String[] tokenizeQuery(String query) {
        return query.toLowerCase()
            .replaceAll("[^\\w\\s]", " ")
            .split("\\s+");
    }

    public static class ExpandedQuery {
        private final String originalQuery;
        private final List<String> expandedTerms;
        private final List<String> conceptTags;

        public ExpandedQuery(String originalQuery, List<String> expandedTerms, List<String> conceptTags) {
            this.originalQuery = originalQuery;
            this.expandedTerms = expandedTerms;
            this.conceptTags = conceptTags;
        }

        public String getOriginalQuery() {
            return originalQuery;
        }

        public List<String> getExpandedTerms() {
            return expandedTerms;
        }

        public List<String> getConceptTags() {
            return conceptTags;
        }
    }
}