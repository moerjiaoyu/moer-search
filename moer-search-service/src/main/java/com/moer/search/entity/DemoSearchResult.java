package com.moer.search.entity;


import java.util.List;

/**
 * @author yinbp[yin-bp@163.com]
 */
public class DemoSearchResult {
	private List<Demo> demos;
	private long totalSize;

	public List<Demo> getDemos() {
		return demos;
	}

	public void setDemos(List<Demo> demos) {
		this.demos = demos;
	}

	public long getTotalSize() {
		return totalSize;
	}

	public void setTotalSize(long totalSize) {
		this.totalSize = totalSize;
	}
}
