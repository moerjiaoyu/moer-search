package com.moer.search.entity;

import com.frameworkset.orm.annotation.PrimaryKey;

import java.sql.Timestamp;

public class PositionUrl implements java.io.Serializable {
	/**
	 * 主键
	 */
	@PrimaryKey
	private String id;
	/**
	 * 触点URL
	 */
	private String positionUrl;
	/**
	 * 触点名称
	 */
	private String positionName;
	/**
	 * 创建时间
	 */
	private Timestamp createtime;
	public PositionUrl() {
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getPositionUrl() {
		return positionUrl;
	}

	public void setPositionUrl(String positionUrl) {
		this.positionUrl = positionUrl;
	}

	public String getPositionName() {
		return positionName;
	}

	public void setPositionName(String positionName) {
		this.positionName = positionName;
	}

	public Timestamp getCreatetime() {
		return createtime;
	}

	public void setCreatetime(Timestamp createtime) {
		this.createtime = createtime;
	}
}