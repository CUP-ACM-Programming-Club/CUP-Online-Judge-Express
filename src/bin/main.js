/* eslint-disable no-console */
/* eslint-disable require-atomic-updates */
const ENVIRONMENT = process.env.NODE_ENV;
require("../module/init/preinstall")();
require("../module/init/build_env")();
const config = global.config;
import UserValidatorMiddleware from "../module/websocket/UserValidatorMiddleware";
import BindUserInfo from "../module/websocket/BindUserInfo";
require("debug")("express:server");
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
let port;
let dockerRunner;
import localJudge from "../module/judger";
import UnjudgedSubmissionCollector from "../module/judger/UnjudgedSubmissionCollector";
import initEnv from "../middleware/init_env";
const _dockerRunner = require("../module/docker_runner");
dockerRunner = new _dockerRunner(config.judger.oj_home, config.judger.oj_judge_num);
const {app, server} = require("../module/init/http-server");
if (process.env.MODE === "websocket") {
	port = process.env.PORT || config.ws.websocket_client_port;
	const RuntimeErrorHandler = require("../module/judger/RuntimeErrorHandler");
	localJudge.setErrorHandler(new RuntimeErrorHandler());
	UnjudgedSubmissionCollector.setJudger(localJudge).start();
} else {
	port = process.env.PORT || 0;
	app.use(initEnv);
}
const cache_query = require("../module/mysql_cache");
const submitControl = require("../module/submitControl");
const cookie = require("cookie");
const sessionMiddleware = require("../module/session").sessionMiddleware;
const {ConfigManager} = require("../module/config/config-manager");
import OnlineUserSet from "../module/websocket/set/OnlineUserSet";
import NormalUserSet from "../module/websocket/set/NormalUserSet";
import AdminUserSet from "../module/websocket/set/AdminUserSet";
import SubmissionSet from "../module/websocket/set/SubmissionSet";
import SocketSet from "../module/websocket/set/SocketSet";
import UserSocketSet from "../module/websocket/set/UserSocketSet";
import SubmissionOriginSet from "../module/websocket/set/SubmissionOriginSet";
import BroadcastManager from "../manager/websocket/BroadcastManager";
import UserSetCollector from "../module/websocket/UserSetCollector";
import OnlineUserBroadcast from "../manager/websocket/OnlineUserBroadcast";
import SolutionUserCollector from "../module/judger/SolutionUserCollector";
import BuildSocketStatus, {buildSocket} from "../module/websocket/BuildSocketStatus";
import ContestPagePushSet from "../module/websocket/set/ContestPagePushSet";
import StatusSet from "../module/websocket/singleton/StatusSet";
import InitExternalEnvironment from "../module/init/InitExternalEnvironment";
import ProblemFromSpecialSubject from "../module/websocket/set/ProblemFromSpecialSubject";
import SubmitUserInfo from "../module/websocket/set/SubmitUserInfo";
import ProblemFromContest from "../module/websocket/set/ProblemFromContest";
import SolutionContext from "../module/websocket/set/SolutionContext";
import JudgeManager from "../manager/judge/JudgeManager";

InitExternalEnvironment.run();
ConfigManager.useMySQLStore().initConfigMap().initSwitchMap();
const io = require("socket.io")(server);
require("../module/init/express_loader")(app, io);

let whiteboard = new Set();

/**
 * 本地判题WebSocket服务器建立连接
 */

global.submissions = SubmissionSet.getInnerStorage();
global.contest_mode = false;


/**
 * 监听端口
 */

server.listen(port, function () {
	logger.info("Server listening at port %d", port);
});

process.on("message", function (message, connection) {
	if (message !== "sticky-session:connection") {
		return;
	}

	server.emit("connection", connection);

	connection.resume();
});


localJudge.on("change", (freeJudger) => {
	BroadcastManager.sendMessage(NormalUserSet.getInnerStorage(), "judgerChange", freeJudger);
	BroadcastManager.sendMessage(AdminUserSet.getInnerStorage(), "judgerChange", freeJudger);
	BroadcastManager.sendMessage(NormalUserSet.getInnerStorage(), "freeJudgerNumber", { num: freeJudger.length});
	BroadcastManager.sendMessage(AdminUserSet.getInnerStorage(), "freeJudgerNumber", { num: freeJudger.length });
});

function removeStatus(socket) {
	const contest_id = socket.contest_id;
	if (contest_id) {
		ContestPagePushSet.removeFromList(contest_id);
	}
	if (socket.status) {
		StatusSet.remove(socket);
	}
}

function whiteBoardBroadCast(socket, content) {
	for (let _socket of whiteboard.values()) {
		if (_socket !== socket) {
			_socket.emit("whiteboard", {
				type: "content",
				from: socket.user_id,
				content
			});
		}
	}
}

/**
 * 从ExpressJS提取Session信息，将Session与当前的Socket绑定
 */

io.use((socket, next) => {
	sessionMiddleware(socket.request, socket.request.res, next);
});

/**
 * 验证用户身份合法性
 */

io.use(UserValidatorMiddleware);

/**
 * 查询用户权限
 */

io.use(BindUserInfo);

/**
 * 分离URL,根据权限分离用户
 */

io.use(UserSetCollector);

/**
 * 处理URL包含的信息
 */

io.use(BuildSocketStatus);
/**
 * Socket获得连接
 */
io.on("connection", async function (socket) {
	socket.on("auth", function (data) {
		if (!socket.send_auth && socket.auth) {
			socket.send_auth = true;
			const pos = OnlineUserSet.get(socket.user_id);
			pos.identity = socket.privilege ? "admin" : "normal";
			//pos.intranet_ip = pos.intranet_ip || data["intranet_ip"] || socket.handshake.address || "未知";
			//pos.ip = pos.ip || data["ip"] || "";
			pos.version = data["version"] || "";
			pos.platform = data["platform"] || "";
			pos.browser_core = data["browser_core"] || "";
			pos.useragent = data["useragent"] || "";
			pos.screen = data["screen"] || "";
			pos.frontend_version = data.frontend_version || "1.0.0-default";
			pos.nick = pos.nick || socket.user_nick || data["nick"];
			pos.lastUpdated = Date.now();
			if ((!socket.url || (socket.url.length && socket.url.length === 0)) && data["url"]) {
				let url = data["url"];
				if (~url.indexOf(socket.handshake.headers.origin)) {
					url = url.substring(url.lastIndexOf(":"), url.length);
				}
				socket.url = url;
				pos.url.push(url);
			}
			OnlineUserBroadcast.broadcast();
		}
	});

	/**
     * 获取状态信息
     */
	socket.on("getUser", function () {
		OnlineUserBroadcast.broadcast();
	});

	socket.on("updateURL", function (data) {
		removeStatus(socket);
		const user = OnlineUserSet.get(socket.user_id);
		user.lastUpdated = Date.now();
		const pos = user.url.indexOf(socket.url);
		if (pos !== -1) {
			user.url[pos] = data.url;
		}
		socket.url = data.url;
		buildSocket(socket);
		OnlineUserBroadcast.broadcast();
	});

	socket.on("status", function () {
		// deprecated
	});
	/**
     * 提交推送处理
     */
	socket.on("submit", async function (_data) {
		/**
         * { submission_id: 61459,
         * val:
         * { id: '',
         * input_text: '1 2',
         * language: '1',
         * source: '',
         * type: 'problem',
         * csrf: '' },
         * user_id: '',
         * nick: '' }
         *
         */
		let data = Object.assign({}, _data);
		let response;
		try {
			response = await submitControl(socket.request, data.val, cookie.parse(socket.handshake.headers.cookie));
		} catch (e) {
			socket.emit("reject_submit", e);
			console.log(e);
			return;
		}
		if (!response.solution_id) {
			socket.emit("reject_submit", response);
			return;
		}
		data.submission_id = data.solution_id = response.solution_id;
		const ip = OnlineUserSet.get(socket.user_id).ip;
		const fingerprint = data.val.fingerprint;
		const fingerprintRaw = data.val.fingerprintRaw;
		SolutionContext.set(data.submission_id, {
			ip,
			fingerprint,
			fingerprintRaw
		});
		data.user_id = socket.user_id || "";
		data.nick = socket.user_nick;
		const submission_id = parseInt(data.submission_id);
		SubmissionSet.set(submission_id, socket);
		const avatar = await cache_query("select avatar,avatarUrl from users where user_id = ?", [data.user_id]);
		SubmitUserInfo.set(submission_id, {
			nick: data.nick,
			user_id: data.user_id,
			in_date: new Date().toISOString(),
			avatar: !!avatar[0].avatar,
			avatarUrl: avatar[0].avatarUrl
		});
		data.val.avatar = !!avatar[0].avatar;
		data.val.avatarUrl = avatar[0].avatarUrl;
		if (data.val && typeof data.val.cid !== "undefined" && !isNaN(parseInt(data.val.cid))) {
			const id_val = await cache_query(`SELECT problem_id FROM 
                contest_problem WHERE contest_id=? and num=?`, [Math.abs(data.val.cid), data.val.pid]);
			if (id_val.length && id_val[0].problem_id) {
				data.val.id = id_val[0].problem_id;
				ProblemFromContest.set(submission_id, {
					contest_id: data.val.cid,
					num: data.val.pid
				});
			}
		} else if (data.val && typeof data.val.tid !== "undefined" && !isNaN(parseInt(data.val.tid))) {
			const id_val = await cache_query(`SELECT problem_id FROM 
			special_subject_problem WHERE topic_id = ? and num = ?`, [Math.abs(data.val.tid), data.val.pid]);
			if (id_val.length && id_val[0].problem_id) {
				data.val.id = id_val[0].problem_id;
				ProblemFromSpecialSubject.set(submission_id, {
					topic: data.val.topic_id,
					num: data.val.pid
				});
			}
		}
		Object.assign(data.val, SolutionContext.get(submission_id));
		if ((data.val && data.val.cid)) {
			const contest_id = Math.abs(parseInt(data.val.cid)) || 0;
			if (contest_id >= 1000) {
				BroadcastManager.sendMessage(ContestPagePushSet.get(contest_id), "submit", data, 1);
				BroadcastManager.sendMessage(StatusSet.getList(), "submit", data, 1, ProblemFromContest.has(submission_id));
				SubmissionOriginSet.set(submission_id, contest_id);
			}
		} else {
			BroadcastManager.sendMessage(StatusSet.getList(), "submit", data, 1);
		}
		const language = parseInt(data.val.language);
		SolutionUserCollector.set(data.submission_id, data);
		let localEnvJudge = true;
		switch (language) {
		case 15:
		case 22:
			dockerRunner.addTask(data);
			break;
		default:
			localEnvJudge = await JudgeManager.addJudgeRequest(data.submission_id, socket.privilege);
		}
		if (!localEnvJudge) {
			socket.emit("remoteJudge", {
				solutionId: response.solution_id
			});
		}
		BroadcastManager.sendMessage(AdminUserSet.getInnerStorage(), "judger", localJudge.getStatus());
	});
	/**
     * 全局推送功能
     */
	socket.on("msg", function (data) {
		if (data.to) {
			for (const soc of SocketSet.toArray()) {
				if (soc.url.indexOf(data.to) === 0) {
					soc.emit("msg", data);
				}
			}
		} else {
			socket.broadcast.emit("msg", data);
		}
		socket.emit("msg", data);
	});
	/**
     * 聊天功能，向目标用户发送聊天信息
     */

	socket.on("chat", function (data) {
		const toPersonUser_id = data.to;
		const userSocketList = UserSocketSet.get(toPersonUser_id);
		if (userSocketList && userSocketList.length && userSocketList.length > 0 && userSocketList[0].emit) {
			BroadcastManager.sendMessage(userSocketList, "chat", {
				from: data.from,
				content: data.content,
				time: Date.now().toString()
			});
		}
	});

	socket.on("whiteboard", function (data) {
		if (data.request === "register" && !whiteboard.has(socket)) {
			whiteboard.add(socket);
		} else if (data.request === "text") {
			whiteBoardBroadCast(socket, data.content);
		}
	});

	function removeWhiteboardRecord() {
		if (whiteboard.has(socket)) {
			whiteboard.delete(socket);
		}
	}

	/**
     * 断开连接销毁所有保存的数据
     */
	socket.on("disconnect", function () {
		const userId = socket.user_id;
		let pos = OnlineUserSet.get(userId);
		if (pos && !socket.hasClosed) {
			socket.hasClosed = true;
			removeWhiteboardRecord();
			SocketSet.remove(socket.currentTimeStamp);
			let url_pos = pos.url.indexOf(socket.url);
			if (~url_pos)
				pos.url.splice(url_pos, 1);
			removeStatus(socket);
			let socket_pos;
			if (socket.privilege) {
				socket_pos = AdminUserSet.get(userId).indexOf(socket);
				if (~socket_pos) {
					AdminUserSet.get(userId).splice(socket_pos, 1);
				}
			} else {
				socket_pos = NormalUserSet.get(userId).indexOf(socket);
				if (~socket_pos) {
					NormalUserSet.get(userId).splice(socket_pos, 1);
				}
			}
			if (!pos.url.length) {
				UserSocketSet.remove(userId);
				OnlineUserSet.remove(userId);
				AdminUserSet.remove(userId);
				NormalUserSet.remove(userId);
			}
			OnlineUserBroadcast.broadcast();
		}
	});
});

if (ENVIRONMENT === "autotest") {
	process.exit(0);
}
