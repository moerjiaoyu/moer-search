package com.moer.search.utils;

import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Slf4j
public class UuidUtils {

    public static String getUuid() {
        return UUID.randomUUID().toString().replaceAll("-", "");
    }
}
