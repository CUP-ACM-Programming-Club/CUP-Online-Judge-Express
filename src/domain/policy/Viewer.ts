/**
 * 发起操作的人（用例的输入模型）。用例只关心登录会话里的身份和权限标记；
 * HTTP 层直接把 express 的 req 传进来即可（结构上满足），用例层因此不依赖 express。
 */
export interface Viewer {
	session?: Record<string, any>;
}

/** 带查询参数的输入模型（比赛列表等按 query 筛选的用例）。 */
export interface ViewerWithQuery extends Viewer {
	query: Record<string, any>;
}
