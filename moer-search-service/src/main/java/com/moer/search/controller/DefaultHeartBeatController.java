package com.moer.search.controller;

import cn.hutool.core.date.DateUtil;
import com.moer.search.entity.RestResult;
import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Api(tags = "公共接口管理")
@RestController
@RequestMapping({"/static"})
public class DefaultHeartBeatController {

    @Value("${spring.application.name}")
    private String applicationName;

    public DefaultHeartBeatController() {
    }

    @GetMapping({"/heartbeat"})
    public RestResult heartBeat() {
        Map<String, String> responseMap = new HashMap(2);
        responseMap.put("application", this.applicationName);
        responseMap.put("time", DateUtil.now());
        return RestResult.success(responseMap);
    }
}