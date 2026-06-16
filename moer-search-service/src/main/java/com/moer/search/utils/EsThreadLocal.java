package com.moer.search.utils;



import com.moer.search.entity.EsDetail;

import java.util.List;

public class EsThreadLocal {

    private static ThreadLocal<List<EsDetail>> threadLocal = new ThreadLocal<>();

    /**
     * 设置请求信息到当前线程中
     *
     * @param esDetail
     */
    public static void setEsDetail(List<EsDetail> esDetail) {
        threadLocal.set(esDetail);
    }

    /**
     * 从当前线程中获取请求信息
     */
    public static List<EsDetail> getEsDetail() {
        return threadLocal.get();
    }

    /**
     * 销毁
     */
    public static void remove() {
        threadLocal.remove();
    }
}
