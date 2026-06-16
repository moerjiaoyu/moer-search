package com.moer.search.aspect;

import com.alibaba.fastjson2.JSON;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.logging.log4j.ThreadContext;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.ModelAndView;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.*;

/**
 * @author moer
 */
@Aspect
@Order(1)
@Slf4j
@Component
public class LogAspect {

    private static final String COMMA = ",";

    @Value("${spring.application.name:Application-Unknown}")
    private String applicationName;

    @Around("@within(org.springframework.web.bind.annotation.RestController)")
    public Object deBefore(ProceedingJoinPoint joinPoint) throws Throwable {
        this.before(joinPoint);
        final StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        Object object = joinPoint.proceed();
        stopWatch.stop();
        this.after(object, stopWatch.getTotalTimeMillis());
        return object;
    }

    private void before(ProceedingJoinPoint joinPoint) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return;
        }
        HttpServletRequest request = attributes.getRequest();
        Enumeration<String> names = request.getHeaderNames();
        List<String> header = new ArrayList<>();
        while (names.hasMoreElements()) {
            String name = names.nextElement();
            header.add(name + " = " + request.getHeader(name));
        }

        String logId = UUID.randomUUID().toString();
        ThreadContext.put("logId", logId);
        HttpServletResponse response = attributes.getResponse();
        if (response != null) {
            response.addHeader("logId", logId);
        }
        if (log.isInfoEnabled()) {
            String message = "\n【{}】请求相关信息：\n【请求头信息】->【{}】,\n【请求方法】->【{}】,\n【请求参数】->【{}】";
            log.info(message, applicationName, StringUtils.join(header, COMMA), joinPoint.getSignature(), Arrays.toString(joinPoint.getArgs()));
        }
    }

    private void after(Object object, long totalTimeMillis) {
        if (null != object && log.isInfoEnabled()) {
            String message = "\n【{}】执行情况：\n执行时间为：【{}毫秒】\n返回值为：【{}】";
            log.info(message, applicationName, totalTimeMillis, object instanceof ModelAndView ? object.toString() : JSON.toJSONString(object));
        }
    }
}
