# 权限矩阵（路由清单）

> 本文件由 `script/permission-inventory.ts` 从真实路由树生成（门禁列来自挂载链，handler 内判断来自 `script/permission-annotations.ts` 手工标注）。
> 修改路由或权限后重新生成：
> `TS_NODE_TRANSPILE_ONLY=1 NODE_ENV=autotest node -r ts-node/register -r ./src/test/setup/mock-external.ts script/permission-inventory.ts`

- 路由总数（method + path，去重）：**224**；顶层路由均由 router_loader 同时挂在 `/x` 与 `/api/x`，下表只列 `/x`。
- 计数（按有效要求归类）：
  - admin: 86
  - admin | editor: 4
  - admin | source_browser: 1
  - anonymous: 18
  - contest-specific: 10
  - init-only: 3
  - login: 93
  - owner / source-privilege: 9
- 标记的不一致 / 疑似漏洞：**33** 条（其中本阶段已修复 4 条，见“已修复”列）

术语：
- `login` = 经 `auth` 中间件（含 ban_check、contest_mode 刷新）；`admin` = `session.isadmin`；`editor` / `source_browser` / `contest_manager` 为全局权限位。
- `contest-access(cid)` = `ContestService.checkContestAccess`：admin 或 maker(m<cid>) 直接放行；否则 contest_mode 与 cmod_visible 必须一致；defunct 需 contest_manager | c<cid> | assistant；未开始拒绝；private 需 contest_manager | c<cid> | assistant。
- `assistant(cid)` = `ContestAssistantManager.userIsContestAssistant`（比赛助教或所属专题助教，缓存 1 小时）。
- `source-privilege(sid)` = `SourcePrivilegeCache.checkPrivilege`：admin | source_browser | 该提交所属比赛的 assistant（缓存 10 秒）。
- `switch:*` = 功能开关拦截器，admin 绕过。

| Method | Path | 挂载链门禁 | 有效要求 | 说明 | 不一致 / 疑似漏洞 | 已修复 |
|---|---|---|---|---|---|---|
| GET | `/acmsubmit` | auth | login | 响应带 admin 标志 |  |  |
| GET | `/admin/account/ban` | auth → admin | admin |  |  |  |
| POST | `/admin/account/ban` | auth → admin | admin |  |  |  |
| POST | `/admin/account/ban/delete` | auth → admin | admin |  |  |  |
| POST | `/admin/account/check` | auth → admin | admin |  |  |  |
| GET | `/admin/account/defunct` | auth → admin | admin |  |  |  |
| POST | `/admin/account/defunct` | auth → admin | admin |  |  |  |
| POST | `/admin/account/generate/batch` | auth → admin | admin |  |  |  |
| GET | `/admin/account/invite/all` | auth → admin | admin |  |  |  |
| POST | `/admin/account/invite/add` | auth → admin | admin |  |  |  |
| GET | `/admin/account/invite` | auth → admin | admin |  |  |  |
| POST | `/admin/account/invite/expire` | auth → admin | admin |  |  |  |
| GET | `/admin/account/list/:page` | auth → admin | admin |  |  |  |
| POST | `/admin/account/password/modify` | auth → admin | admin |  |  |  |
| GET | `/admin/account/privilege` | auth → admin | admin |  |  |  |
| POST | `/admin/account/privilege/add` | auth → admin | admin |  |  |  |
| POST | `/admin/account/privilege/remove` | auth → admin | admin |  |  |  |
| GET | `/admin/account/teamlist` | auth → admin | admin |  |  |  |
| POST | `/admin/award/add` | auth → admin | admin |  |  |  |
| POST | `/admin/award/edit/:award_id` | auth → admin | admin |  |  |  |
| GET | `/admin/award/get/:award_id` | auth → admin | admin |  |  |  |
| GET | `/admin/award/list/:page` | auth → admin | admin |  |  |  |
| POST | `/admin/award/remove/:award_id` | auth → admin | admin |  |  |  |
| POST | `/admin/contest/add` | auth → admin | admin |  |  |  |
| POST | `/admin/contest/assistant/remove` | auth → admin | admin |  | 被前面注册的 POST /:topicId 遮蔽，实际执行 setContestAssistantByTopic（topicId="remove"） | phase5 fix(a)：/remove 注册到 /:topicId 之前，移除助教可达 |
| POST | `/admin/contest/assistant/:topicId` | auth → admin | admin | admin/contest.ts 挂载层没有 admin，各子文件自带 admin（edit 例外） |  |  |
| POST | `/admin/contest/assistant` | auth → admin | admin |  |  |  |
| GET | `/admin/contest/assistant/all` | auth → admin | admin |  |  |  |
| GET | `/admin/contest/assistant/:contestId` | auth → admin | admin |  |  |  |
| GET | `/admin/contest/defunct` | auth → admin | admin |  |  |  |
| POST | `/admin/contest/defunct` | auth → admin | admin |  |  |  |
| GET | `/admin/contest/edit/:id` | auth → privilegeMiddleware | admin \| contest_manager(全局) \| assistant(params.id) |  | 出题人 m<cid> 不能编辑自己的比赛，而 contest_manager 可编辑任意比赛 |  |
| POST | `/admin/contest/edit` | auth → privilegeMiddleware | admin \| contest_manager(全局) \| assistant(body.contest_id) |  |  |  |
| GET | `/admin/contest/edit/user/:id` | auth → privilegeMiddleware | admin \| contest_manager(全局) \| assistant(params.id) |  |  |  |
| GET | `/admin/contest/list/:page` | auth → admin | admin |  |  |  |
| POST | `/admin/contestset/add` | auth → admin | admin |  |  |  |
| GET | `/admin/contestset/defunct` | auth → admin | admin |  |  |  |
| POST | `/admin/contestset/defunct` | auth → admin | admin |  |  |  |
| POST | `/admin/contestset/edit` | auth → admin | admin |  |  |  |
| GET | `/admin/contestset/:contestSetId` | auth → admin | admin |  |  |  |
| GET | `/admin/contestset/list/:page` | auth → admin | admin |  |  |  |
| GET | `/admin/problem/data/get/:problemId/:fileName` | auth → admin | admin |  |  |  |
| GET | `/admin/problem/data/remove/:problemId/:fileName` | auth → admin | admin |  |  |  |
| POST | `/admin/problem/data/set/:problemId` | auth → admin | admin |  |  |  |
| POST | `/admin/problem/data/set/multiple/:problemId` | auth → admin | admin |  |  |  |
| GET | `/admin/problem/defunct` | auth → admin | admin |  |  |  |
| POST | `/admin/problem/defunct` | auth → admin | admin |  |  |  |
| GET | `/admin/problem/download/data/:problemId/:fileName` | auth → admin | admin |  |  |  |
| GET | `/admin/problem/list/:page` | auth → admin | admin |  |  |  |
| POST | `/admin/problem/rejudge/contest` | auth → admin | admin |  |  |  |
| POST | `/admin/problem/rejudge/solution` | auth → admin | admin |  |  |  |
| POST | `/admin/problem/rejudge/problem` | auth → admin | admin |  |  |  |
| GET | `/admin/setting` | auth → admin | admin |  |  |  |
| GET | `/admin/setting/:label` | auth → admin | admin |  |  |  |
| POST | `/admin/setting` | auth → admin | admin |  |  |  |
| GET | `/admin/solution/download/contest/:contestId` | auth → admin | admin |  |  |  |
| GET | `/admin/solution/download/contest/:contestId/lastAck` | auth → admin | admin |  |  |  |
| GET | `/admin/store/mysql_cache/remove/:key` | auth → admin | admin |  |  |  |
| GET | `/admin/store/mysql_cache/removeAll` | auth → admin | admin |  |  |  |
| GET | `/admin/store/mysql_cache` | auth → admin | admin |  |  |  |
| GET | `/admin/system/compile/compile_arguments` | auth → admin | admin |  |  |  |
| POST | `/admin/system/compile/compile_arguments` | auth → admin | admin |  |  |  |
| GET | `/admin/system/hot-reload` | auth → admin | admin |  |  |  |
| GET | `/admin/system/log/out` | auth → admin | admin |  |  |  |
| GET | `/admin/system/log/err` | auth → admin | admin |  |  |  |
| GET | `/admin/topic/defunct` | auth → admin | admin |  |  |  |
| POST | `/admin/topic/defunct` | auth → admin | admin |  |  |  |
| GET | `/admin/topic/list/:page` | auth → admin | admin |  |  |  |
| GET | `/captcha` | - | anonymous |  |  |  |
| GET | `/contest/assistant/:contest_id` | auth | login | 只返回“我”是否为该比赛助教 |  |  |
| GET | `/contest/config/:contestId` | auth | login | 无比赛访问检查，只返回 showSim |  |  |
| GET | `/contest/problem_info/:contestId` | auth → privilegeMiddleware | admin \| contest_manager（且 contest-access(cid)） | 中间件写的是 admin \| contest_manager \| maker(cid) \| assistant(cid)，但挂在挂载层，req.params.contestId 尚未解析（NaN），maker / assistant 两项永远为假；contest_maker 取值无可选链，session 无 contest_maker 时抛错 | 出题人 / 助教本意应可访问，实际被拒（矩阵测试锁定现状） |  |
| GET | `/contest/rest/:contest_id` | auth | contest-access(cid) |  |  |  |
| GET | `/contest/user/:cid` | auth | login |  | cid 合法时 handler 从不响应（请求挂起）——功能缺陷，非权限 |  |
| GET | `/contest/general/:cid` | auth | contest-access(cid) |  |  |  |
| GET | `/contest/problem/:cid` | auth | contest-access(cid) | 比赛未结束时 pid 对非 (admin\|contest_manager\|assistant) 打码；响应 admin 字段即该特权 |  |  |
| GET | `/contest/list` | auth | login | 非 admin/contest_manager 过滤 defunct；contest_mode 下按 cmod_visible = (isadmin ? 0 : 1) 过滤（admin 只看到 cmod_visible=0 的比赛，怪癖） |  |  |
| GET | `/contest/v2/list` | auth | login | 同 /contest/list |  |  |
| GET | `/contest/list/all` | auth | login | 非 admin/contest_manager 过滤 defunct | 不做 contest_mode/cmod_visible 过滤，比 /contest/list 宽松 |  |
| GET | `/contest/total` | auth | login | 同 /contest/list |  |  |
| GET | `/contest/statistics/:cid` | auth | login |  | 无 contest-access 检查：私有/隐藏/未开始比赛的提交结果分布对任意登录用户可见（详情接口 general/problem 有检查） |  |
| POST | `/contest/password/:cid` | auth | login |  |  |  |
| GET | `/contestset/list/:contestSetId` | auth | login；非 admin 要求 contest_set.defunct='N'（不看 visible） |  |  |  |
| GET | `/contestset/set/:contestSetId` | auth | login |  | 无 defunct/visible 检查；列表 /contestset/set 对非 admin 过滤 defunct='N' and visible=1，详情更宽松 |  |
| GET | `/contestset/set` | auth | login | 非 admin 只列 defunct='N' and visible=1 |  |  |
| GET | `/discuss/my` | auth → switch:enable_discuss(admin bypass) | login | 不做 contest_mode 检查 |  |  |
| GET | `/discuss/:id` | auth → switch:enable_discuss(admin bypass) | login；contest_mode 下要求 admin \| source_browser |  | 不检查 article.defunct（列表对非 admin 过滤 defunct）；返回所有回复者与楼主的 email |  |
| GET | `/discuss` | auth → switch:enable_discuss(admin bypass) | login；contest_mode 下要求 admin \| source_browser | 非 admin 过滤 defunct |  |  |
| POST | `/discuss/reply/:id` | auth → switch:enable_discuss(admin bypass) | login |  |  |  |
| GET | `/discuss/search/:search_val` | auth → switch:enable_discuss(admin bypass) | login |  | 不过滤 defunct、不做 contest_mode 检查 |  |
| POST | `/discuss/newpost` | auth → switch:enable_discuss(admin bypass) | login |  |  |  |
| POST | `/discuss/update/main/:id` | auth → switch:enable_discuss(admin bypass) | owner（SQL where user_id=?，非本人静默成功无效果；admin 也不能改他人） |  |  |  |
| POST | `/discuss/update/:id` | auth → switch:enable_discuss(admin bypass) | login | 读帖子正文，任意登录用户，含 defunct |  |  |
| POST | `/discuss/update/reply/:id/:comment_id` | auth → switch:enable_discuss(admin bypass) | owner（同上） |  |  |  |
| GET | `/discuss/update/reply/:id/:comment_id` | auth → switch:enable_discuss(admin bypass) | login |  |  |  |
| GET | `/discuss/update/reply/block/:id/:comment_id` | auth → switch:enable_discuss(admin bypass) | login |  | 任意登录用户可“屏蔽”任意回复（改写回复内容），应为管理员操作 |  |
| POST | `/env/client` | auth | login |  |  |  |
| GET | `/export/contest_code/:contest_id` | auth | admin（handler 内 checkAdmin） |  |  |  |
| GET | `/export` | auth → admin | admin | export.ts 与 export_rpk.ts 都挂 /export，auth 执行两次 |  |  |
| GET | `/faq` | - | anonymous |  |  |  |
| GET | `/file/:problem_id` | auth | login |  |  |  |
| GET | `/homepage` | - | anonymous |  |  |  |
| GET | `/` | - | anonymous |  |  |  |
| POST | `/init/firstrun/admin` | init-only | init-only | 仅 config.init 为假（首次安装）时可达 |  |  |
| POST | `/init/firstrun/config` | init-only | init-only | 仅首次安装时可达 |  |  |
| GET | `/init/firstrun` | init-only | init-only | 仅首次安装时可达；返回整个 global.config（含密钥） |  |  |
| GET | `/login` | - | anonymous | 返回调用者自己的完整 session 对象 |  |  |
| POST | `/login/token` | - | anonymous |  |  |  |
| POST | `/login/newlogin` | - | anonymous |  |  |  |
| POST | `/login` | - | anonymous |  |  |  |
| GET | `/logout` | auth | login |  |  |  |
| GET | `/lost/password/:user_id` | - | anonymous |  |  |  |
| POST | `/lost/password` | - | anonymous |  |  |  |
| GET | `/photo/description/:problem_id` | auth | login |  | 不检查题目可见性（私有题 / 进行中比赛题的图片可读），/photo 下四个接口相同 |  |
| GET | `/photo/input/:problem_id` | auth | login |  |  |  |
| GET | `/photo/output/:problem_id` | auth | login |  |  |  |
| GET | `/photo/hint/:problem_id` | auth | login |  |  |  |
| GET | `/privilege` | auth | login |  |  |  |
| GET | `/problem/contest_list/:problemId` | auth → admin | admin |  |  |  |
| GET | `/problem/prefile/prepend/:problem_id` | auth | login |  | 不检查题目可见性（私有题/比赛题的前置代码可读） |  |
| GET | `/problem/prefile/append/:problem_id` | auth | login |  | 同上 |  |
| POST | `/problem/prefile/prepend` | auth → admin | admin |  |  |  |
| POST | `/problem/prefile/append` | auth → admin | admin |  |  |  |
| GET | `/problem/module/search/:val` | auth | login | 非 admin 拼 `defunct='N' AND a OR b OR ...` | 运算符优先级：defunct 过滤只作用于 problem_id LIKE，私有题可经 title/source/description/label 命中；不排除比赛中题目、不做 contest_mode 检查 |  |
| GET | `/problem/module/search/dropdown/:val` | auth | login |  | 同 /problem/module/search/:val |  |
| GET | `/problem/:id(\d+)` | auth | login；非 (admin \| source_browser)：contest_mode 拒绝、defunct 拒绝、在未结束比赛中拒绝 |  | editor 不在豁免内（editor 可提交/编辑私有题，却不能在此查看） |  |
| GET | `/problem/:source` | auth | ?id 同 /problem/:id；?cid&pid：非 (admin\|source_browser) 且 contest_mode 且 cmod_visible=0 拒绝，private=1 时 contest-access(cid)；?tid&pid：contest_mode 下要求 admin\|source_browser |  | ?cid&pid 对公开比赛不做开始时间与 defunct 检查：未开始/隐藏的公开比赛题面可提前读取；?tid&pid 不检查专题 private/defunct，也不检查题目 defunct/比赛中 |  |
| POST | `/problem/add` | auth | login |  | 任意登录用户可创建题目并获得 p<pid>（problem_maker） |  |
| POST | `/problem/:source/:id` | auth | admin \| editor（handler 内，拒绝返回 "illegal request"） |  |  |  |
| GET | `/problem/:source/:id/:sid` | auth | admin（代码写的是 admin \| owner，但 owner 取 source_code.user_id，该表无此列，实际只有 admin） |  | 结果缓存（10 天）在权限检查之前读取：admin 看过之后，任意登录用户可拿到同一 key 的代码（矩阵测试锁定现状） |  |
| GET | `/problemset` | auth → switch:enable_problemset(admin bypass) | login | admin \| source_browser \| editor 可见范围更大（含 defunct 等）；/problemset/* 同 |  |  |
| GET | `/problemset/search/:search` | auth → switch:enable_problemset(admin bypass) | login |  |  |  |
| GET | `/problemset/:start` | auth → switch:enable_problemset(admin bypass) | login |  |  |  |
| GET | `/problemset/:start/:search` | auth → switch:enable_problemset(admin bypass) | login |  |  |  |
| GET | `/problemset/:start/:search/:order` | auth → switch:enable_problemset(admin bypass) | login |  |  |  |
| GET | `/problemset/:start/:search/:order/:order_rule` | auth → switch:enable_problemset(admin bypass) | login |  |  |  |
| GET | `/problemstatus/:id` | auth | login | 时间/内存分布与他人提交详情需 admin \| source_browser \| 比赛已结束 \| 本人已通过 |  |  |
| GET | `/problemstatus/:source/:id` | auth | login | 同上 |  |  |
| GET | `/ranklist` | auth | login | ip/email 等敏感字段只对 admin 与本人保留 |  |  |
| GET | `/ranklist/acmmember` | auth | login |  |  |  |
| GET | `/ranklist/oldmember` | auth | login |  |  |  |
| GET | `/ranklist/user` | auth | login |  |  |  |
| POST | `/register` | - | anonymous |  |  |  |
| GET | `/reset/password` | auth | login |  |  |  |
| GET | `/runtime/:id` | auth | login |  | handler 从不响应（请求挂起）——功能缺陷，非权限 |  |
| GET | `/scoreboard/:cid` | auth | contest-access(cid) | browserPrivilege = admin \| contest_manager \| assistant；敏感字段另加 maker(cid) |  |  |
| GET | `/scoreboard/:cid/line` | auth | contest-access(cid) | 同上 |  |  |
| GET | `/setting/ban_user` | auth → admin | admin |  |  |  |
| GET | `/setting/ban_user/:user_id` | auth → admin | admin |  |  |  |
| POST | `/setting/ban_user` | auth → admin | admin |  |  |  |
| GET | `/setting/devconfig/config` | auth → admin | admin |  |  |  |
| GET | `/setting/devconfig/switch` | auth → admin | admin |  |  |  |
| POST | `/setting/devconfig/config/update` | auth → admin | admin |  |  |  |
| POST | `/setting/devconfig/switch/update` | auth → admin | admin |  |  |  |
| POST | `/setting/devconfig/config/delete` | auth → admin | admin |  |  |  |
| POST | `/setting/devconfig/switch/delete` | auth → admin | admin |  |  |  |
| GET | `/soa-proxy` | - | anonymous |  |  |  |
| GET | `/soa-proxy/hello/:name` | - | anonymous |  |  |  |
| GET | `/solution/info/:solutionId` | auth | admin \| owner（SolutionManager validator） |  |  |  |
| GET | `/source/:source/:id` | auth | login；contest_mode 下要求 source-privilege(sid)；代码可见：source-privilege \| owner \| share=1 \| 题解引用 |  | share=1 不排除仍在进行中的比赛题（status 列表与 ProblemService 会排除） |  |
| GET | `/specialsubject` | auth | login |  |  |  |
| GET | `/specialsubject/:cid` | auth | login |  |  |  |
| GET | `/static/*` | static | anonymous |  |  |  |
| GET | `/status/result` | auth | login |  |  |  |
| GET | `/status/device/os` | auth | login |  |  |  |
| GET | `/status/device/browser` | auth | login |  |  |  |
| GET | `/status/device/all` | auth | login |  |  |  |
| GET | `/status/sim` | auth | login |  | 任意登录用户可取任意比赛（或全站）的查重相似对 |  |
| GET | `/status/sim/:cid` | auth | login |  | 同上 |  |
| GET | `/status/runtimeerror` | auth | admin \| source_browser |  |  |  |
| GET | `/status/submit_hour` | auth | login |  |  |  |
| POST | `/status/ban_submission` | auth → admin | admin |  |  |  |
| POST | `/status/rejudge` | auth → admin | admin |  |  |  |
| GET | `/status/compile_info/:solution_id` | auth | admin \| source-privilege(sid) \| owner |  |  |  |
| GET | `/status/runtime_info/:solution_id` | auth | admin \| source-privilege(sid)（本人不可） |  |  |  |
| GET | `/status/ip` | auth | login |  |  |  |
| GET | `/status/problem/code_length` | auth | login |  |  |  |
| GET | `/status/problem/code_length/problem/:problem_id` | auth | login |  |  |  |
| GET | `/status/problem/code_length/contest/:contest_id` | auth | login |  |  |  |
| GET | `/status/problem/solve_map/user` | auth → switch:enable_solvemap(admin bypass) | login |  |  |  |
| GET | `/status/problem/solve_map/aclist` | auth → switch:enable_solvemap(admin bypass) | login |  |  |  |
| GET | `/status/problem/solve_map/aclist/:user_id` | auth → switch:enable_solvemap(admin bypass) | login |  |  |  |
| GET | `/status/problem/solve_map/:problem_id` | auth → switch:enable_solvemap(admin bypass) | login |  |  |  |
| GET | `/status/problem/solve_map` | auth → switch:enable_solvemap(admin bypass) | login |  |  |  |
| GET | `/status/:problem_id/:user_id/:language/:result/:limit` | auth | login |  |  |  |
| GET | `/status/:problem_id/:user_id/:language/:result/:limit/:contest_id` | auth | login | browse_code = admin \| source_browser \| assistant(contest_id)；敏感字段另加 contest_manager / maker(cid) | 按 contest_id 查询不做 contest-access：私有/隐藏比赛的提交列表（去敏后）对任意登录用户可见 |  |
| GET | `/status/:problem_id/:user_id/:language/:result/:limit/:sim` | auth | login |  |  |  |
| GET | `/status/:problem_id/:user_id/:language/:result/:limit/:contest_id/:sim` | auth | login |  |  |  |
| GET | `/status/:problem_id/:user_id/:language/:result/:limit/:sim/:privilege` | auth | login |  |  |  |
| GET | `/status/:problem_id/:user_id/:language/:result/:limit/:contest_id/:sim/:privilege` | auth | login |  |  |  |
| GET | `/status` | auth | login | browse_code = admin \| source_browser；ip/指纹/email 只对特权与本人保留 |  |  |
| GET | `/status/graph` | auth | login |  |  |  |
| GET | `/status/solution` | auth | owner \| source-privilege(sid) \| share===1 | share 由 SQL 计算：share=1 或题解引用，且题目不在未结束的比赛中 |  |  |
| GET | `/status/:sid/:tr` | auth → inline | login |  | 任意登录用户可读任意提交的编译错误 / 运行错误信息（绕过 runtime_info 的特权要求） |  |
| GET | `/system/config/version_control/version` | - | anonymous | 前端“版本控制”页匿名调用，保持公开 |  |  |
| GET | `/system/config/version_control/git` | admin | admin（requireAdmin，无 auth，与 /system/log 一致） |  | 匿名暴露仓库地址 | phase5 fix(b)：限 admin（前端未调用） |
| GET | `/system/config/version_control/dependencies` | admin | admin（requireAdmin，无 auth，与 /system/log 一致） |  | 匿名暴露依赖及版本 | phase5 fix(b)：限 admin（前端未调用） |
| GET | `/system/config/version_control/devDependencies` | admin | admin（requireAdmin，无 auth，与 /system/log 一致） |  | 匿名暴露开发依赖及版本 | phase5 fix(b)：限 admin（前端未调用） |
| GET | `/system/judge/compile` | - | anonymous | 前端“编译参数”页匿名调用，保持公开 |  |  |
| GET | `/system/log/login/latest` | admin | admin | 只有 admin 中间件、没有 auth：靠 session.isadmin，不经 ban/contest_mode/权限刷新 |  |  |
| GET | `/system/log/login/user/:userId` | admin | admin |  |  |  |
| GET | `/system/stat/loadavg` | - | anonymous |  | 匿名可读服务器负载；前端未使用，本阶段未改（低敏感） |  |
| GET | `/tutorial/:source/:id` | auth → switch:enable_tutorial(admin bypass) | login |  |  |  |
| GET | `/tutorial/:tutorial_id` | auth → switch:enable_tutorial(admin bypass) | login |  |  |  |
| GET | `/tutorial` | auth → switch:enable_tutorial(admin bypass) | login |  |  |  |
| POST | `/tutorial/new/:source/:id` | auth → switch:enable_tutorial(admin bypass) | solution owner |  | checkCaptcha 返回值被忽略 |  |
| POST | `/tutorial/edit/:tutorial_id` | auth → switch:enable_tutorial(admin bypass) | solution owner 且 (tutorial owner \| admin) |  | checkCaptcha 返回值被忽略 |  |
| GET | `/update_log` | auth | login |  |  |  |
| GET | `/update_log/latest` | - | anonymous |  |  |  |
| POST | `/upload` | auth → requireAny | admin \| editor（403 JSON） |  |  |  |
| POST | `/upload/user` | auth → requireAny | admin \| editor（403 JSON） |  |  |  |
| GET | `/upload` | auth → requireAny | admin \| editor（403 JSON） |  |  |  |
| GET | `/user/recent_register` | auth | login |  |  |  |
| GET | `/user/register_timeline` | auth | login |  |  |  |
| GET | `/user/submit_stat/:user_id/:start_time/:end_time` | auth | login |  |  |  |
| GET | `/user/submit_stat/:user_id` | auth | login |  |  |  |
| GET | `/user/self` | auth | login |  |  |  |
| POST | `/user/update/profile` | auth | login |  |  |  |
| GET | `/user/lost/question/:user_id` | auth | login | 与匿名的 /lost/password 功能重复 |  |  |
| POST | `/user/lost/answer` | auth | login | 可按密保答案重置任意用户密码（与匿名 /lost/password 相同能力） |  |  |
| GET | `/user/tutorial/:user_id` | auth | login |  |  |  |
| GET | `/user/email/:user_id` | auth | login |  | 任意登录用户可取任意用户 email（phase2 隐私去敏未覆盖） |  |
| GET | `/user/:user_id` | auth | login |  | 任意登录用户可取任意用户的 email、登录 OS/浏览器统计、查重统计 |  |
| GET | `/user/nick/:nick` | auth | login |  |  |  |

## 横切问题（不属于单个路由）

- **WebSocket 身份可被 cookie 覆盖**（已修复：phase5 fix(c)：有登录 session 时以 session.user_id 为准；无 session 时仍按 cookie user_id + token 校验）：src/interfaces/websocket/UserValidatorMiddleware.ts：`socket.user_id = cookie.user_id || session.user_id`，且只要 session 有 user_id 就直接放行——登录用户改 user_id cookie 即可在 socket 上冒充他人（privilege 仍取自自己的 session）。
- **contest_manager 是全局权限**：不按比赛区分：可编辑任意比赛（/admin/contest/edit）、可进入任意 private/defunct 比赛、看所有比赛的未打码题号与 ip；但 checkContestAccess 里不豁免 cmod_visible 与开始时间（admin / maker 才豁免）。
- **global.contest_mode 是进程级全局变量**：由非 admin 请求经 auth→contest_mode 中间件刷新，admin 请求不刷新；所有请求共享同一个值。
- **router_loader 子目录双挂载**：router_loader(router, dir) 对子目录把同一个 [path, ...middleware, router] 挂两次（_dir 分支的 else）。无副作用的门禁中间件会执行两次；若某 handler 调 next() 会被第二次挂载再次处理。
- **/login/token 的 session 可能缺少权限位**：先 res.json 再 await login_action：express-session 在响应结束时保存，login_action 写入的 isadmin / contest_maker 等可能不落库，后续请求中这些字段为 undefined（contest_maker 等 map 缺失时，未用可选链的调用点会抛错）。
- **/monitor 页面匿名可访问**：express-status-monitor 的 HTML 页面无鉴权；指标数据只推给已加入 esm 房间的 admin socket（phase 2 已限制）。
- **ContestModeChecker 装饰器无引用**：src/interfaces/http/decorators/ContestModeChecker.ts 未被使用（死代码），其语义与 policy.canBrowseSource 相同。
