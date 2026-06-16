package com.moer.search.enums;

public enum EsResultEnum {
    Created("created"),

    Updated("updated"),

    Deleted("deleted"),

    NotFound("not_found"),

    NoOp("noop"),

    ;

    private final String jsonValue;

    EsResultEnum(String jsonValue) {
        this.jsonValue = jsonValue;
    }

    public String jsonValue() {
        return this.jsonValue;
    }

}
