/* eslint-disable no-console */
/* eslint-disable require-atomic-updates */
const ENVIRONMENT = process.env.NODE_ENV;
require("../module/init/preinstall")();
require("../module/init/build_env")();
const config = global.config;
import UserValidatorMiddleware from "../module/websocket/UserValidatorMiddleware";
import BindUserInfo from "../module/websocket/BindUserInfo";
// const easyMonitor = require("easy-monitor");
// easyMonitor("CUP Online Judge Express");
require("debug")("express:server");
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
let port, wsport;
let dockerRunner;
const localJudge = require("../module/judger");
const _dockerRunner = require("../module/docker_runner");
dockerRunner = new _dockerRunner(config.judger.oj_home, config.judger.oj_judge_num);
if (process.env.MODE === "websocket") {
	port = process.env.PORT || config.ws.websocket_client_port;
	wsport = process.env.WSPORT || config.ws.judger_port;
	const RuntimeErrorHandler = require("../module/judger/RuntimeErrorHandler");
	localJudge.setErrorHandler(new RuntimeErrorHandler());
	const databaseSubmissionCollector = require("../module/judger/DatabaseSubmissionCollector");
	databaseSubmissionCollector.setJudger(localJudge).start();
} else {
	port = process.env.PORT || 0;
	wsport = process.env.WSPORT || 0;
	const dash = require("appmetrics-dash");
	const dashConfig = require("../module/init/dash-config");
	dash.monitor(dashConfig);
}
const cache_query = require("../module/mysql_cache");
const submitControl = require("../module/submitControl");
const cookie = require("cookie");
const sessionMiddleware = require("../module/session").sessionMiddleware;
const WebSocket = require("ws");

const BanCheaterModel = require("../module/contest/cheating_ban");
const querystring = require("querystring");
const {storeSubmission} = require("../module/judger/recorder");
const {solutionContainContestId, getSolutionInfo} = require("../module/solution/solution");
const {ConfigManager} = require("../module/config/config-manager");

const wss = new WebSocket.Server({port: wsport});
const banCheaterModel = new BanCheaterModel();
const ErrorCollector = require("../module/error/collector");
const OnlineUserSet = require("../module/websocket/OnlineUserSet");
const NormalUserSet = require("../module/websocket/NormalUserSet");
const AdminUserSet = require("../module/websocket/AdminUserSet");
const SubmissionSet = require("../module/websocket/SubmissionSet");
const SocketSet = require("../module/websocket/SocketSet");
const UserSocketSet = require("../module/websocket/UserSocketSet");
const initExternalEnvironment = require("../module/init/InitExternalEnvironment");
const SolutionUserCollector = require("../module/judger/SolutionUserCollector").default;

initExternalEnvironment.run();
ConfigManager.useMySQLStore().initConfigMap().initSwitchMap();
const {app, server} = require("../module/init/http-server");
const io = require("socket.io")(server);
require("../module/init/express_loader")(app, io);

/**
 * 记录打开状态页面的Socket连接
 * @type {{status: Array, contest_status: {}}}
 */
let pagePush = {
	status: [],
	contest_status: {}
};

let whiteboard = new Set();

/**
 * 根据submission类型绑定对应的contest_id
 * @type {{Number}}
 */

let submissionOrigin = {};
/**
 * 本地判题WebSocket服务器建立连接
 */

let problemFromContest = {};
let problemFromSpecialSubject = {};
let submitUserInfo = {};
let solutionContext = {};

global.submissions = SubmissionSet.getInnerStorage();
global.contest_mode = false;

function clearBinding(solution_id) {
	if (problemFromContest[solution_id]) {
		delete problemFromContest[solution_id];
	}
	if (problemFromSpecialSubject[solution_id]) {
		delete problemFromSpecialSubject[solution_id];
	}
	if (submissionOrigin[solution_id]) {
		delete submissionOrigin[solution_id];
	}
	delete submitUserInfo[solution_id];
	SubmissionSet.remove(solution_id);
	delete solutionContext[solution_id];
}

async function banSubmissionChecker(solution_pack) {
	if (!ConfigManager.isSwitchedOn("ban_contest_cheater", 0)) {
		return;
	}
	if (parseInt(solution_pack.sim) === 100 && solution_pack.state === 4 &&
        (Object.prototype.hasOwnProperty.call(solution_pack, "contest_id") || await solutionContainContestId(solution_pack.solution_id))) {
		if (!Object.prototype.hasOwnProperty.call(solution_pack, "contest_id")) {
			Object.assign(solution_pack, await getSolutionInfo(solution_pack.solution_id));
		}
		Object.assign(solution_pack, {state: 15});
		const {contest_id, num, user_id, solution_id} = solution_pack;
		await banCheaterModel.addCheating(user_id, contest_id, {solution_id, num});
	}
}

wss.on("connection", function (ws) {
	/**
     * 绑定judger发送的事件
     */
	ws.on("error", console.log);
	ws.on("judger", async function (message) {
		const solutionPack = message;
		const finished = parseInt(solutionPack.finish);
		const solutionId = parseInt(solutionPack.solution_id);
		Object.assign(solutionPack, submitUserInfo[solutionId], problemFromContest[solutionId], problemFromSpecialSubject[solutionId], solutionContext[solutionId]);
		if (finished) {
			await banSubmissionChecker(solutionPack);
			await storeSubmission(solutionPack);
		}

		if (SubmissionSet.has(solutionId)) {
			SubmissionSet.get(solutionId).emit("result", solutionPack);
			sendMessage(pagePush.status, "result", solutionPack, 1, !!problemFromContest[solutionId]);
			if (submissionOrigin[solutionId]) {
				sendMessage(pagePush.contest_status[submissionOrigin[solutionId]], "result", solutionPack, 1);
			}
		}

		if (finished) {
			clearBinding(solutionId);
		}
	});

	ws.on("vjudgeJudgerStatus", () => {

	});

	/**
     * 获得推送信息，根据信息类型emit对应事件
     */
	ws.on("message", function (message) {
		let request;
		try {
			request = JSON.parse(message);
		} catch (e) {
			ErrorCollector.push(__filename, e);
			logger.fatal(`Error:\n
			Error name:${e.name}\n
			Error Message:${e.message}
			`);
			return;
		}
		if (request.type && typeof request.type === "string") {
			ws.emit(request.type, request.value, request);
		} else {
			logger.fatal(`Error:Parsing message failed.Receive data:${message}`);
		}
	});
});


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

/**
 * 广播信息
 * @param userArr 用户Socket数组
 * @param type 发送信息类型
 * @param value 发送对象
 * @param dimension 数组维度
 * @param privilege 权限限制
 */

function sendMessage(userArr, type, value, dimension = 2, privilege = false) {
	if (dimension === 2) {
		for (let i in userArr) {
			try {
				if (!Object.prototype.hasOwnProperty.call(userArr, i) || null === userArr[i]) {
					continue;
				}
				if (userArr[i] === undefined) {
					delete userArr[i];
					continue;
				}
			} catch (e) {
				ErrorCollector.push(__filename, {error: e, i, userArr});
				console.log("i in userArr");
				console.log("i", i);
				console.log("userArr", userArr);
			}
			for (let j in userArr[i]) {
				try {
					if (!Object.prototype.hasOwnProperty.call(userArr[i], j) || null === userArr[i][j]) {
						continue;
					}
					if (userArr[i][j] === undefined) {
						delete userArr[i][j];
						continue;
					}
					if (userArr[i][j].url && userArr[i][j].url.indexOf("monitor") !== -1) {
						continue;
					}
					if (!privilege || userArr[i][j].privilege) {
						userArr[i][j].emit(type, value);
					}
				} catch (e) {
					ErrorCollector.push(__filename, j, userArr[i]);
					console.log("j in userArr[i]");
					console.log("j", j);
					console.log("userArr[i]", userArr[i]);
				}
			}
		}
	} else if (dimension === 1) {
		for (let i in userArr) {
			if (!Object.prototype.hasOwnProperty.call(userArr, i) || null === userArr[i] || (userArr[i].url && userArr[i].url.indexOf("monitor") !== -1)) {
				continue;
			}
			if (!privilege || userArr[i].privilege) {
				userArr[i].emit(type, value);
			}
		}
	}
}

localJudge.on("change", (freeJudger) => {
	sendMessage(NormalUserSet.getInnerStorage(), "judgerChange", freeJudger);
	sendMessage(AdminUserSet.getInnerStorage(), "judgerChange", freeJudger);
});

/**
 * 向不同权限的用户广播用户信息
 */

function onlineUserBroadcast() {
	let online = OnlineUserSet.getAllValues();
	let userArr = {
		user_cnt: online.length,
		user: online.map(e => {
			return {
				user_id: (e && e.user_id) ? e.user_id : ""
			};
		})
	};
	sendMessage(NormalUserSet.getInnerStorage(), "user", {
		user: userArr, judger: localJudge.getStatus().free_judger
	});
	userArr.user = online;
	sendMessage(NormalUserSet.getInnerStorage(), "user", {
		user: userArr, judger: localJudge.getStatus().free_judger
	});
}

function removeStatus(socket) {
	const contest_id = socket.contest_id;
	if (contest_id) {
		const socket_pos = pagePush.contest_status[contest_id].indexOf(socket);
		if (~socket_pos) {
			pagePush.contest_status[contest_id].splice(socket_pos, 1);
		}
	}
	if (socket.status) {
		const socket_pos = pagePush.status.indexOf(socket);
		if (~socket_pos) {
			pagePush.status.splice(socket_pos, 1);
		}
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

io.use((socket, next) => {
	const pos = OnlineUserSet.get(socket.user_id);
	const referer = socket.handshake.headers.referer || "";
	const origin = socket.handshake.headers.origin || "";
	const _url = referer.substring(origin.length || referer.indexOf("/", 9));
	const userId = socket.user_id;

	if (_url.length && _url.length > 0) {
		socket.url = _url;
	}
	if (pos !== null && pos !== undefined && pos && pos.url) {
		if (_url.length > 0) {
			pos.url.push(_url);
		}
		UserSocketSet.get(userId).push(socket);
		if (socket.privilege) {
			AdminUserSet.get(userId).push(socket);
		} else {
			NormalUserSet.get(userId).push(socket);
		}
	} else {
		let user = {
			user_id: socket.user_id,
			url: [],
			nick: socket.user_nick,
			useragent: socket.handshake.headers["user-agent"]
		};
		if (socket.handshake.headers["x-forwarded-for"]) {
			const iplist = socket.handshake.headers["x-forwarded-for"].split(",");
			user.ip = iplist[0];
			user.intranet_ip = iplist[1];
		} else {
			user.intranet_ip = socket.handshake.address;
			user.ip = "";
		}
		if (_url.length && _url.length > 0) {
			user.url.push(_url);
		}
		UserSocketSet.set(userId, [socket]);
		OnlineUserSet.set(userId, user);
		if (socket.privilege) {
			AdminUserSet.set(userId, [socket]);
		} else {
			NormalUserSet.set(userId, [socket]);
		}
	}
	onlineUserBroadcast();
	next();
});

/**
 * 处理URL包含的信息
 */
function buildStatusSocket(socket) {
	if (socket.url && (~socket.url.indexOf("status") || ~socket.url.indexOf("rank"))) {
		if (~socket.url.indexOf("cid")) {
			const parseObj = querystring.parse(socket.url.substring(socket.url.indexOf("?") + 1, socket.url.length));
			const contest_id = parseInt(parseObj.cid) || 0;
			if (contest_id >= 1000) {
				if (!pagePush.contest_status[contest_id]) {
					pagePush.contest_status[contest_id] = [];
				}
				socket.contest_id = contest_id;
				pagePush.contest_status[contest_id].push(socket);
			}
		} else {
			const url_split = socket.url.split("/");
			if (url_split.includes("contest")) {
				const idx = url_split.indexOf("contest");
				if (idx < url_split.length - 1) {
					if (!isNaN(url_split[idx + 1])) {
						const contest_id = parseInt(url_split[idx + 1]);
						if (!pagePush.contest_status[contest_id]) {
							pagePush.contest_status[contest_id] = [];
						}
						socket.contest_id = contest_id;
						pagePush.contest_status[contest_id].push(socket);
					} else if (url_split[idx + 1] === "rank" && !isNaN(url_split[idx + 2])) {
						const contest_id = parseInt(url_split[idx + 2]);
						if (!pagePush.contest_status[contest_id]) {
							pagePush.contest_status[contest_id] = [];
						}
						socket.contest_id = contest_id;
						pagePush.contest_status[contest_id].push(socket);
					}
				}
			} else {
				pagePush.status.push(socket);
				socket.status = true;
			}
		}
	}
}

io.use((socket, next) => {
	buildStatusSocket(socket);
	socket.currentTimeStamp = (new Date() - 0);
	SocketSet.setSocket(socket.currentTimeStamp, socket);
	next();
});
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
			onlineUserBroadcast();
		}
	});

	/**
     * 获取状态信息
     */
	socket.on("getUser", function () {
		onlineUserBroadcast();
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
		buildStatusSocket(socket);
		onlineUserBroadcast();
	});

	socket.on("status", function (data) {
		if (socket.privilege) {
			const request = data["request"];
			if (request && request === "judger") {
				socket.emit(localJudge.getStatus());
			}
		}
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
		solutionContext[data.submission_id] = {
			ip,
			fingerprint,
			fingerprintRaw
		};
		data.user_id = socket.user_id || "";
		data.nick = socket.user_nick;
		const submission_id = parseInt(data.submission_id);
		SubmissionSet.set(submission_id, socket);
		const avatar = await cache_query("select avatar,avatarUrl from users where user_id = ?", [data.user_id]);
		submitUserInfo[submission_id] = {
			nick: data.nick,
			user_id: data.user_id,
			in_date: new Date().toISOString(),
			avatar: !!avatar[0].avatar,
			avatarUrl: avatar[0].avatarUrl
		};
		data.val.avatar = !!avatar[0].avatar;
		data.val.avatarUrl = avatar[0].avatarUrl;
		if (data.val && typeof data.val.cid !== "undefined" && !isNaN(parseInt(data.val.cid))) {
			const id_val = await cache_query(`SELECT problem_id FROM 
                contest_problem WHERE contest_id=? and num=?`, [Math.abs(data.val.cid), data.val.pid]);
			if (id_val.length && id_val[0].problem_id) {
				data.val.id = id_val[0].problem_id;
				problemFromContest[submission_id] = {
					contest_id: data.val.cid,
					num: data.val.pid
				};
			}
		} else if (data.val && typeof data.val.tid !== "undefined" && !isNaN(parseInt(data.val.tid))) {
			const id_val = await cache_query(`SELECT problem_id FROM 
			special_subject_problem WHERE topic_id = ? and num = ?`, [Math.abs(data.val.tid), data.val.pid]);
			if (id_val.length && id_val[0].problem_id) {
				data.val.id = id_val[0].problem_id;
				problemFromSpecialSubject[submission_id] = {
					topic: data.val.topic_id,
					num: data.val.pid
				};
			}
		}
		Object.assign(data.val, solutionContext[submission_id]);
		if ((data.val && data.val.cid)) {
			const contest_id = Math.abs(parseInt(data.val.cid)) || 0;
			if (contest_id >= 1000) {
				sendMessage(pagePush.contest_status[contest_id], "submit", data, 1);
				sendMessage(pagePush.status, "submit", data, 1, !!problemFromContest[submission_id]);
				submissionOrigin[submission_id] = contest_id;
			}
		} else {
			sendMessage(pagePush.status, "submit", data, 1);
		}
		const language = parseInt(data.val.language);
		SolutionUserCollector.set(data.submission_id, data);
		switch (language) {
		case 15:
		case 22:
			dockerRunner.addTask(data);
			break;
		default:
			localJudge.addTask(data.submission_id, socket.privilege);
		}
		sendMessage(AdminUserSet.getInnerStorage(), "judger", localJudge.getStatus());
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
			sendMessage(userSocketList, "chat", {
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
			onlineUserBroadcast();
		}
	});
});

if (ENVIRONMENT === "autotest") {
	process.exit(0);
}
