/**
 * 路由内（handler / service 层）的权限判断，无法从挂载链自动推断，手工标注。
 * key: "METHOD /path"（与 permission-inventory 输出一致，不含 /api 前缀）
 * req:  覆盖自动推断的有效权限要求
 * note: 补充说明（数据面差异、怪癖）
 * flag: 不一致 / 疑似漏洞（只记录，不在本阶段修复，除非 fixed 注明）
 */
export interface Annotation { req?: string; note?: string; flag?: string; fixed?: string }

export const ANNOTATIONS: Record<string, Annotation> = {
	"GET /acmsubmit": { note: "响应带 admin 标志" },

	"GET /admin/contest/edit/:id": { req: "admin | contest_manager(全局) | assistant(params.id)", flag: "出题人 m<cid> 不能编辑自己的比赛，而 contest_manager 可编辑任意比赛" },
	"POST /admin/contest/edit": { req: "admin | contest_manager(全局) | assistant(body.contest_id)" },
	"GET /admin/contest/edit/user/:id": { req: "admin | contest_manager(全局) | assistant(params.id)" },
	"POST /admin/contest/assistant/remove": { flag: "被前面注册的 POST /:topicId 遮蔽，实际执行 setContestAssistantByTopic（topicId=\"remove\"）", fixed: "phase5 fix(a)：/remove 注册到 /:topicId 之前，移除助教可达" },
	"POST /admin/contest/assistant/:topicId": { note: "admin/contest.ts 挂载层没有 admin，各子文件自带 admin（edit 例外）" },

	"GET /contest/assistant/:contest_id": { note: "只返回“我”是否为该比赛助教" },
	"GET /contest/config/:contestId": { note: "无比赛访问检查，只返回 showSim" },
	"GET /contest/problem_info/:contestId": { req: "admin | contest_manager（且 contest-access(cid)）", note: "中间件写的是 admin | contest_manager | maker(cid) | assistant(cid)，但挂在挂载层，req.params.contestId 尚未解析（NaN），maker / assistant 两项永远为假；contest_maker 取值无可选链，session 无 contest_maker 时抛错", flag: "出题人 / 助教本意应可访问，实际被拒（矩阵测试锁定现状）" },
	"GET /contest/rest/:contest_id": { req: "contest-access(cid)" },
	"GET /contest/user/:cid": { flag: "cid 合法时 handler 从不响应（请求挂起）——功能缺陷，非权限" },
	"GET /contest/general/:cid": { req: "contest-access(cid)" },
	"GET /contest/problem/:cid": { req: "contest-access(cid)", note: "比赛未结束时 pid 对非 (admin|contest_manager|assistant) 打码；响应 admin 字段即该特权" },
	"GET /contest/list": { note: "非 admin/contest_manager 过滤 defunct；contest_mode 下按 cmod_visible = (isadmin ? 0 : 1) 过滤（admin 只看到 cmod_visible=0 的比赛，怪癖）" },
	"GET /contest/v2/list": { note: "同 /contest/list" },
	"GET /contest/total": { note: "同 /contest/list" },
	"GET /contest/list/all": { note: "非 admin/contest_manager 过滤 defunct", flag: "不做 contest_mode/cmod_visible 过滤，比 /contest/list 宽松" },
	"GET /contest/statistics/:cid": { flag: "无 contest-access 检查：私有/隐藏/未开始比赛的提交结果分布对任意登录用户可见（详情接口 general/problem 有检查）" },

	"GET /contestset/list/:contestSetId": { req: "login；非 admin 要求 contest_set.defunct='N'（不看 visible）" },
	"GET /contestset/set/:contestSetId": { flag: "无 defunct/visible 检查；列表 /contestset/set 对非 admin 过滤 defunct='N' and visible=1，详情更宽松" },
	"GET /contestset/set": { note: "非 admin 只列 defunct='N' and visible=1" },

	"GET /discuss/my": { note: "不做 contest_mode 检查" },
	"GET /discuss/:id": { req: "login；contest_mode 下要求 admin | source_browser", flag: "不检查 article.defunct（列表对非 admin 过滤 defunct）；返回所有回复者与楼主的 email" },
	"GET /discuss": { req: "login；contest_mode 下要求 admin | source_browser", note: "非 admin 过滤 defunct" },
	"GET /discuss/search/:search_val": { flag: "不过滤 defunct、不做 contest_mode 检查" },
	"POST /discuss/update/main/:id": { req: "owner（SQL where user_id=?，非本人静默成功无效果；admin 也不能改他人）" },
	"POST /discuss/update/reply/:id/:comment_id": { req: "owner（同上）" },
	"POST /discuss/update/:id": { note: "读帖子正文，任意登录用户，含 defunct" },
	"GET /discuss/update/reply/block/:id/:comment_id": { flag: "任意登录用户可“屏蔽”任意回复（改写回复内容），应为管理员操作" },

	"GET /export/contest_code/:contest_id": { req: "admin（handler 内 checkAdmin）" },
	"GET /export": { note: "export.ts 与 export_rpk.ts 都挂 /export，auth 执行两次" },

	"POST /init/firstrun/admin": { note: "仅 config.init 为假（首次安装）时可达" },
	"POST /init/firstrun/config": { note: "仅首次安装时可达" },
	"GET /init/firstrun": { note: "仅首次安装时可达；返回整个 global.config（含密钥）" },
	"GET /login": { note: "返回调用者自己的完整 session 对象" },

	"GET /photo/description/:problem_id": { flag: "不检查题目可见性（私有题 / 进行中比赛题的图片可读），/photo 下四个接口相同" },
	"GET /problem/prefile/prepend/:problem_id": { flag: "不检查题目可见性（私有题/比赛题的前置代码可读）" },
	"GET /problem/prefile/append/:problem_id": { flag: "同上" },
	"GET /problem/module/search/:val": { note: "非 admin 拼 `defunct='N' AND a OR b OR ...`", flag: "运算符优先级：defunct 过滤只作用于 problem_id LIKE，私有题可经 title/source/description/label 命中；不排除比赛中题目、不做 contest_mode 检查" },
	"GET /problem/module/search/dropdown/:val": { flag: "同 /problem/module/search/:val" },
	"GET /problem/:id(\\d+)": { req: "login；非 (admin | source_browser)：contest_mode 拒绝、defunct 拒绝、在未结束比赛中拒绝", flag: "editor 不在豁免内（editor 可提交/编辑私有题，却不能在此查看）" },
	"GET /problem/:source": { req: "?id 同 /problem/:id；?cid&pid：非 (admin|source_browser) 且 contest_mode 且 cmod_visible=0 拒绝，private=1 时 contest-access(cid)；?tid&pid：contest_mode 下要求 admin|source_browser", flag: "?cid&pid 对公开比赛不做开始时间与 defunct 检查：未开始/隐藏的公开比赛题面可提前读取；?tid&pid 不检查专题 private/defunct，也不检查题目 defunct/比赛中" },
	"POST /problem/add": { flag: "任意登录用户可创建题目并获得 p<pid>（problem_maker）" },
	"POST /problem/:source/:id": { req: "admin | editor（handler 内，拒绝返回 \"illegal request\"）" },
	"GET /problem/:source/:id/:sid": { req: "admin（代码写的是 admin | owner，但 owner 取 source_code.user_id，该表无此列，实际只有 admin）", flag: "结果缓存（10 天）在权限检查之前读取：admin 看过之后，任意登录用户可拿到同一 key 的代码（矩阵测试锁定现状）" },
	"GET /problemset": { note: "admin | source_browser | editor 可见范围更大（含 defunct 等）；/problemset/* 同" },
	"GET /problemstatus/:id": { note: "时间/内存分布与他人提交详情需 admin | source_browser | 比赛已结束 | 本人已通过" },
	"GET /problemstatus/:source/:id": { note: "同上" },
	"GET /ranklist": { note: "ip/email 等敏感字段只对 admin 与本人保留" },
	"GET /runtime/:id": { flag: "handler 从不响应（请求挂起）——功能缺陷，非权限" },
	"GET /scoreboard/:cid": { req: "contest-access(cid)", note: "browserPrivilege = admin | contest_manager | assistant；敏感字段另加 maker(cid)" },
	"GET /scoreboard/:cid/line": { req: "contest-access(cid)", note: "同上" },

	"GET /solution/info/:solutionId": { req: "admin | owner（SolutionManager validator）" },
	"GET /source/:source/:id": { req: "login；contest_mode 下要求 source-privilege(sid)；代码可见：source-privilege | owner | share=1 | 题解引用", flag: "share=1 不排除仍在进行中的比赛题（status 列表与 ProblemService 会排除）" },

	"GET /status/sim": { flag: "任意登录用户可取任意比赛（或全站）的查重相似对" },
	"GET /status/sim/:cid": { flag: "同上" },
	"GET /status/runtimeerror": { req: "admin | source_browser" },
	"GET /status/compile_info/:solution_id": { req: "admin | source-privilege(sid) | owner" },
	"GET /status/runtime_info/:solution_id": { req: "admin | source-privilege(sid)（本人不可）" },
	"GET /status/:sid/:tr": { flag: "任意登录用户可读任意提交的编译错误 / 运行错误信息（绕过 runtime_info 的特权要求）" },
	"GET /status/solution": { req: "owner | source-privilege(sid) | share===1", note: "share 由 SQL 计算：share=1 或题解引用，且题目不在未结束的比赛中" },
	"GET /status/:problem_id/:user_id/:language/:result/:limit/:contest_id": { note: "browse_code = admin | source_browser | assistant(contest_id)；敏感字段另加 contest_manager / maker(cid)", flag: "按 contest_id 查询不做 contest-access：私有/隐藏比赛的提交列表（去敏后）对任意登录用户可见" },
	"GET /status": { note: "browse_code = admin | source_browser；ip/指纹/email 只对特权与本人保留" },

	"GET /system/config/version_control/version": { note: "前端“版本控制”页匿名调用，保持公开" },
	"GET /system/config/version_control/git": { req: "admin（requireAdmin，无 auth，与 /system/log 一致）", flag: "匿名暴露仓库地址", fixed: "phase5 fix(b)：限 admin（前端未调用）" },
	"GET /system/config/version_control/dependencies": { req: "admin（requireAdmin，无 auth，与 /system/log 一致）", flag: "匿名暴露依赖及版本", fixed: "phase5 fix(b)：限 admin（前端未调用）" },
	"GET /system/config/version_control/devDependencies": { req: "admin（requireAdmin，无 auth，与 /system/log 一致）", flag: "匿名暴露开发依赖及版本", fixed: "phase5 fix(b)：限 admin（前端未调用）" },
	"GET /system/judge/compile": { note: "前端“编译参数”页匿名调用，保持公开" },
	"GET /system/log/login/latest": { note: "只有 admin 中间件、没有 auth：靠 session.isadmin，不经 ban/contest_mode/权限刷新" },
	"GET /system/stat/loadavg": { flag: "匿名可读服务器负载；前端未使用，本阶段未改（低敏感）" },

	"POST /tutorial/new/:source/:id": { req: "solution owner", flag: "checkCaptcha 返回值被忽略" },
	"POST /tutorial/edit/:tutorial_id": { req: "solution owner 且 (tutorial owner | admin)", flag: "checkCaptcha 返回值被忽略" },

	"GET /user/:user_id": { flag: "任意登录用户可取任意用户的 email、登录 OS/浏览器统计、查重统计" },
	"GET /user/email/:user_id": { flag: "任意登录用户可取任意用户 email（phase2 隐私去敏未覆盖）" },
	"GET /user/lost/question/:user_id": { note: "与匿名的 /lost/password 功能重复" },
	"POST /user/lost/answer": { note: "可按密保答案重置任意用户密码（与匿名 /lost/password 相同能力）" },
	"GET /upload": { req: "admin | editor（403 JSON）" },
	"POST /upload": { req: "admin | editor（403 JSON）" },
	"POST /upload/user": { req: "admin | editor（403 JSON）" },
};

/** 不属于单个路由的横切问题 */
export const CROSS_CUTTING: { title: string; detail: string; fixed?: string }[] = [
	{
		title: "WebSocket 身份可被 cookie 覆盖",
		detail: "src/module/websocket/UserValidatorMiddleware.ts：`socket.user_id = cookie.user_id || session.user_id`，且只要 session 有 user_id 就直接放行——登录用户改 user_id cookie 即可在 socket 上冒充他人（privilege 仍取自自己的 session）。",
		fixed: "phase5 fix(c)：有登录 session 时以 session.user_id 为准；无 session 时仍按 cookie user_id + token 校验"
	},
	{
		title: "contest_manager 是全局权限",
		detail: "不按比赛区分：可编辑任意比赛（/admin/contest/edit）、可进入任意 private/defunct 比赛、看所有比赛的未打码题号与 ip；但 checkContestAccess 里不豁免 cmod_visible 与开始时间（admin / maker 才豁免）。"
	},
	{
		title: "global.contest_mode 是进程级全局变量",
		detail: "由非 admin 请求经 auth→contest_mode 中间件刷新，admin 请求不刷新；所有请求共享同一个值。"
	},
	{
		title: "router_loader 子目录双挂载",
		detail: "router_loader(router, dir) 对子目录把同一个 [path, ...middleware, router] 挂两次（_dir 分支的 else）。无副作用的门禁中间件会执行两次；若某 handler 调 next() 会被第二次挂载再次处理。"
	},
	{
		title: "/login/token 的 session 可能缺少权限位",
		detail: "先 res.json 再 await login_action：express-session 在响应结束时保存，login_action 写入的 isadmin / contest_maker 等可能不落库，后续请求中这些字段为 undefined（contest_maker 等 map 缺失时，未用可选链的调用点会抛错）。"
	},
	{
		title: "/monitor 页面匿名可访问",
		detail: "express-status-monitor 的 HTML 页面无鉴权；指标数据只推给已加入 esm 房间的 admin socket（phase 2 已限制）。"
	},
	{
		title: "ContestModeChecker 装饰器无引用",
		detail: "src/decorator/common/ContestModeChecker.ts 未被使用（死代码），其语义与 policy.canBrowseSource 相同。"
	},
];
