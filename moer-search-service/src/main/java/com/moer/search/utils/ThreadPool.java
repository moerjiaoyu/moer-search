package com.moer.search.utils;

import cn.hutool.core.thread.ThreadFactoryBuilder;
import lombok.extern.slf4j.Slf4j;

import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * thread pool
 *
 * @author 54161
 */
@Slf4j
public class ThreadPool {

    private static final long KEEP_ALIVE_TIME = 60L;

    public static final int CUP_CORE_SIZE = Runtime.getRuntime().availableProcessors();

    private static final ThreadFactory THREAD_FACTORY = new ThreadFactoryBuilder().setNamePrefix("thread_pool_%d").build();

    public static final ThreadPoolExecutor THREAD_POOL_EXECUTOR = new ThreadPoolExecutor(
            CUP_CORE_SIZE,
            CUP_CORE_SIZE << 1,
            KEEP_ALIVE_TIME,
            TimeUnit.SECONDS,
            new LinkedBlockingDeque<>(1024),
            THREAD_FACTORY,
            new ThreadPoolExecutor.CallerRunsPolicy()
    );

    public static void execute(Runnable command) {
        THREAD_POOL_EXECUTOR.execute(command);
    }

}
