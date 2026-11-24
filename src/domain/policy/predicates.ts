/**
 * 权限策略：集中所有“谁能做什么”的判断。
 *
 * 约定
 * - 权限位来自 session，由 src/module/login_action.ts 在登录 / 权限刷新时写入：
 *   isadmin、editor、source_browser、contest_manager（全局位，布尔），
 *   contest{c<cid>}、contest_maker{m<cid>}、problem_maker{p<pid>}（按 id 的 map）。
 *   比赛助教不在 session 里，通过注入的 ContestAssistantLookup 查询（组装根把它接到 application 的
 *   ContestAssistantRepository 端口，实现是 ContestAssistantManager，缓存 1 小时）。
 * - 这里的每个函数都逐字搬自原来散落在路由 / service 里的表达式，语义必须与之完全一致；
 *   改动任何一个都会改变线上权限，先改 src/test/policy/permission-matrix.test.ts 的期望并说明理由。
 * - 谓词只回答“是否满足”，返回 boolean；原代码把 session 原值直接回显给前端的字段（如 `isadmin: req.session.isadmin`）
 *   属于响应形状，不经过这里，保持原样。
 *
 * 已知怪癖（保留，不在此修正）
 * - contest_manager 是全局权限：不按比赛区分，但 checkContestAccess 不为它豁免 cmod_visible 与开始时间。
 * - contest_mode 下比赛按 cmod_visible 过滤；admin 与该比赛出题人（m<cid>）豁免。
 * - *Strict 版本对应原代码里没有可选链的写法：session 缺少对应 map 时抛 TypeError（原行为），不要“顺手”改成安全访问。
 */
import dayjs from "dayjs";
import HttpError from "../errors/HttpError";

/** 只要求带 session 的对象（express Request、socket.request、{session} 包装均可） */
export interface PolicySubject {
	session?: any;
}

export type Predicate = (req: any) => boolean | Promise<boolean>;

function session(req: PolicySubject | undefined | null): any {
	return req && req.session ? req.session : undefined;
}

// ---------------------------------------------------------------- 全局权限位

/** 管理员（privilege.rightstr = 'administrator'） */
export function isAdmin(req: PolicySubject | undefined | null): boolean {
	const s = session(req);
	return !!(s && s.isadmin);
}

/** 题目编辑（rightstr 以 editor 开头） */
export function isEditor(req: PolicySubject): boolean {
	const s = session(req);
	return !!(s && s.editor);
}

/** source_browser 权限位本身（不含 admin） */
export function isSourceBrowser(req: PolicySubject): boolean {
	const s = session(req);
	return !!(s && s.source_browser);
}

/** 比赛管理员——全局位，不按比赛区分 */
export function isContestManager(req: PolicySubject): boolean {
	const s = session(req);
	return !!(s && s.contest_manager);
}

/**
 * 可浏览他人代码 / 不受 contest_mode 限制浏览题目与讨论：admin | source_browser。
 * 原写法：`req.session.isadmin || req.session.source_browser`
 */
export function canBrowseSource(req: PolicySubject): boolean {
	return isAdmin(req) || isSourceBrowser(req);
}

/** 可修改题目 / 导入题目：admin | editor */
export function canEditProblem(req: PolicySubject): boolean {
	return isAdmin(req) || isEditor(req);
}

// ---------------------------------------------------------------- 按 id 的权限

/** 比赛出题人 m<cid>（原写法 `req.session.contest_maker?.[\`m${cid}\`]`） */
export function isContestMaker(req: PolicySubject, cid: number | string): boolean {
	const s = session(req);
	return !!(s && s.contest_maker && s.contest_maker[`m${cid}`]);
}

/** 同 isContestMaker，但 session 没有 contest_maker 时抛 TypeError（原 `req.session.contest_maker[...]` 写法） */
export function isContestMakerStrict(req: any, cid: number | string): boolean {
	return !!req.session.contest_maker[`m${cid}`];
}

/** 比赛名单内选手 c<cid>（原写法 `req.session.contest?.[\`c${cid}\`]`） */
export function isContestant(req: PolicySubject, cid: number | string): boolean {
	const s = session(req);
	return !!(s && s.contest && s.contest[`c${cid}`]);
}

/** 题目创建者 p<pid>，session 没有 problem_maker 时抛 TypeError（原写法无可选链） */
export function isProblemMakerStrict(req: any, pid: number | string): boolean {
	return !!req.session.problem_maker[`p${pid}`];
}

/**
 * 「某用户是否为某比赛的助教（含所属专题的助教）」的查询。domain 不碰 I/O，由组装根（main/compose/contest）注入。
 */
export type ContestAssistantLookup = (cid: number | string, userId: string) => Promise<boolean>;

let contestAssistantLookup: ContestAssistantLookup | undefined;

/** 注入助教查询（只应由组装根调用；测试里也可以临时替换，返回原来的查询便于恢复）。 */
export function provideContestAssistantLookup(lookup: ContestAssistantLookup | undefined): ContestAssistantLookup | undefined {
	const previous = contestAssistantLookup;
	contestAssistantLookup = lookup;
	return previous;
}

/** 比赛助教（含所属专题的助教），沿用 ContestAssistantManager 的 1 小时缓存；userId 必须是字符串 */
export async function isContestAssistant(cid: number | string, userId: string): Promise<boolean> {
	if (!contestAssistantLookup) {
		throw new Error("比赛助教查询还没有注入（应在 main/compose 里 provideContestAssistantLookup）");
	}
	return await contestAssistantLookup(cid, userId);
}

// ---------------------------------------------------------------- 组合规则

/** 可看隐藏（defunct）比赛列表：admin | contest_manager */
export function canSeeHiddenContests(req: PolicySubject): boolean {
	return isAdmin(req) || isContestManager(req);
}

/**
 * 比赛管理特权：admin | contest_manager | 该比赛助教。
 * 用于：比赛编辑（/admin/contest/edit）、比赛题号不打码、榜单 browserPrivilege。
 * 短路顺序与原代码一致（前两项为真时不查助教）。
 */
export async function canManageContest(req: any, cid: number | string): Promise<boolean> {
	return isAdmin(req) || isContestManager(req) || await isContestAssistant(cid, req.session.user_id);
}

/**
 * 比赛相关敏感字段（他人 ip / 指纹）：admin | contest_manager | 该比赛出题人。
 * 助教等其他特权由调用方按原逻辑追加。
 */
export function canSeeContestSensitive(req: PolicySubject, contestId: any): boolean {
	if (!session(req)) {
		return false;
	}
	if (isAdmin(req) || isContestManager(req)) {
		return true;
	}
	const cid = parseInt(contestId);
	return !isNaN(cid) && isContestMaker(req, cid);
}

/** 访问私有（defunct）题目 / 进行中比赛的题目提交：admin | editor | 题目创建者（无可选链，见 isProblemMakerStrict） */
export function canAccessHiddenProblem(req: any, problemId: number | string): boolean {
	return isAdmin(req) || isEditor(req) || isProblemMakerStrict(req, problemId);
}

/**
 * 比赛可见性（ContestService.checkContestAccess 的判定部分）：不可见时抛出与原实现一致的 HttpError。
 * 顺序：admin | maker 直接放行 → contest_mode 与 cmod_visible → 隐藏 → 未开始 → 私有。
 */
export async function assertCanViewContest(req: any, contest: any, cid: number): Promise<void> {
	const startTime = dayjs(contest.start_time);
	const now = dayjs();
	if (isAdmin(req) || isContestMaker(req, cid)) {
		return;
	}

	// @ts-ignore
	if (global.contest_mode) {
		if (parseInt(contest.cmod_visible) === 0) {
			throw new HttpError("Contest Mode Active", 403);
		}
	} else if (parseInt(contest.cmod_visible) === 1) {
		throw new HttpError("Contest Mode Active", 403);
	}

	// 隐藏比赛只对能提交它的人开放（contest_manager / 名单内选手 / 助教），与 SubmissionService.checkContestPrivilege 一致
	if (contest.defunct === "Y") {
		const listed = isContestManager(req) || isContestant(req, cid) || await isContestAssistant(cid, req.session.user_id);
		if (!listed) {
			throw new HttpError("Permission denied", 403);
		}
	}

	if (startTime.isAfter(now)) {
		throw new HttpError("Contest not start!", 403);
	}

	if (parseInt(contest.private) === 1) {
		if (isContestManager(req) || isContestant(req, cid)) {
			return;
		}
		if (await isContestAssistant(cid, req.session.user_id)) {
			return;
		}
		throw new HttpError("Permission denied", 403);
	}
}

/** assertCanViewContest 的布尔形式 */
export async function canViewContest(req: any, contest: any, cid: number): Promise<boolean> {
	try {
		await assertCanViewContest(req, contest, cid);
		return true;
	} catch (e) {
		if (e instanceof HttpError) {
			return false;
		}
		throw e;
	}
}
