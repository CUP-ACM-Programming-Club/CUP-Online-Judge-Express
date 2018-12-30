/* eslint-disable no-console */
const ENVIRONMENT = process.env.NODE_ENV;
require("../module/init/preinstall")();
const config = global.config = require("../config.json");
const app = require("../app");
require("debug")("express:server");
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || config.ws.client_port;
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
const cachePool = require("../module/cachePool");
const submitControl = require("../module/submitControl");
const cookie = require("cookie");
const sessionMiddleware = require("../module/session").sessionMiddleware;
// const client = require("../module/redis");
const WebSocket = require("ws");
const _localJudge = require("../module/judger");
const _dockerRunner = require("../module/docker_runner");
const querystring = require("querystring");
const localJudge = new _localJudge(config.judger.oj_home, config.judger.oj_judge_num);
const dockerRunner = new _dockerRunner(config.judger.oj_home, config.judger.oj_judge_num);

const wss = new WebSocket.Server({port: config.ws.judger_port});

String.prototype.exist = function (str) {
	return this.indexOf(str) !== -1;
};
/**
 *
 * @type {{Object}} 记录在线用户的信息
 */
let onlineUser = {};
/**
 *
 * @type {{Socket}} 记录在线用户的Socket连接
 */
let user_socket = {};
/**
 *
 * @type {{Socket}} 记录管理员用户的Socket连接
 */
let admin_user = {};
/**
 *
 * @type {{Socket}} 记录普通用户的Socket连接
 */
let normal_user = {};
/**
 *
 * @type {{Socket}} 记录solution_id对应的Socket连接
 */
let submissions = {};

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

global.submissions = submissions;
global.contest_mode = false;

wss.on("connection", function (ws) {
	/**
	 * 绑定judger发送的事件
	 */
	ws.on("judger", function (message) {
		const solution_pack = message;
		const finished = parseInt(solution_pack.finish);
		const solution_id = parseInt(solution_pack.solution_id);
		if (submitUserInfo[solution_id]) {
			Object.assign(solution_pack, submitUserInfo[solution_id]);
			/*
			solution_pack.nick = submitUserInfo[solution_id].nick;
			solution_pack.user_id = submitUserInfo[solution_id].user_id;
			solution_pack.in_date = submitUserInfo[solution_id].in_date;
			*/
		}
		if (problemFromContest[solution_id]) {
			solution_pack.contest_id = problemFromContest[solution_id].contest_id;
			solution_pack.num = problemFromContest[solution_id].num;
		} else if (problemFromSpecialSubject[solution_id]) {
			solution_pack.topic_id = problemFromSpecialSubject[solution_id].topic_id;
			solution_pack.num = problemFromSpecialSubject[solution_id].num;
		}
		if (solutionContext[solution_id]) {
			Object.assign(solution_pack, solutionContext[solution_id]);
		}
		if (submissions[solution_id]) {
			submissions[solution_id].emit("result", solution_pack);
			sendMessage(pagePush.status, "result", solution_pack, 1, !!problemFromContest[solution_id]);
			if (submissionOrigin[solution_id]) {
				sendMessage(pagePush.contest_status[submissionOrigin[solution_id]], "result", solution_pack, 1);
			}
		}

		if (finished) {
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
			delete submissions[solution_id];
			delete solutionContext[solution_id];
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
			for (let j in userArr[i]) {
				if (!privilege || userArr[i][j].privilege) {
					userArr[i][j].emit(type, value);
				}
			}
		}
	} else if (dimension === 1) {
		for (let i in userArr) {
			if (!privilege || userArr[i].privilege) {
				userArr[i].emit(type, value);
			}
		}
	}
}

localJudge.on("change", (freeJudger) => {
	sendMessage(normal_user, "judgerChange", freeJudger);
	sendMessage(admin_user, "judgerChange", freeJudger);
});

/**
 * 向不同权限的用户广播用户信息
 */

function onlineUserBroadcast() {
	let online = Object.values(onlineUser);
	let userArr = {
		user_cnt: online.length,
		user: online.map(e => {
			if (e && e.user_id) {
				return {
					user_id: e.user_id
				};
			} else {
				return {
					user_id: ""
				};
			}
		})
	};
	sendMessage(normal_user, "user", {
		user: userArr, judger: localJudge.getStatus().free_judger
	});
	userArr.user = online;
	sendMessage(admin_user, "user", {
		user: userArr, judger: localJudge.getStatus().free_judger
	});
}

function whiteBoardBroadCast(socket, content) {
	for (let _socket of whiteboard.values()) {
		if (_socket !== socket) {
			_socket.emit("whiteboard", {
				type: "content",
				from: socket.user_id,
				content: content
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

io.use((socket, next) => {
	const parse_cookie = cookie.parse(socket.handshake.headers.cookie);
	socket.user_id = parse_cookie["user_id"] || socket.request.session.user_id;
	if (!socket.user_id) {
		next(new Error("Auth failed"));
	} else {
		socket.auth = true;
		next();
	}
	/*
    if (!socket.request.session.auth && !socket.auth) {
        const token = parse_cookie["token"] || "";
        const cache_token = await client.lrangeAsync(`${socket.user_id}token`, 0, -1);
        if (~cache_token.indexOf(token)) {
            socket.auth = true;
            next();
        }
        else {

        }
    }
    else {
        next();
    }
    */
});

/**
 * 查询用户权限
 */

io.use(async (socket, next) => {
	if (socket.privilege === undefined) {
		let _privilege;
		if ((_privilege = cachePool.get(`${socket.user_id}privilege`))) {
			socket.privilege = parseInt(_privilege) > 0;
		} else {
			const privilege = await
			query("SELECT count(1) as cnt FROM privilege WHERE rightstr='administrator' and " +
					"user_id=?", [socket.user_id]);
			socket.privilege = parseInt(privilege[0].cnt) > 0;
			cachePool.set(`${socket.user_id}privilege`, socket.privilege ? "1" : "0", 60);
		}
	}
	if (socket.user_nick === undefined) {
		let _nick;
		if ((_nick = cachePool.get(`${socket.user_id}nick`)) && _nick.length) {
			socket.user_nick = _nick;
		} else {
			const nick = await
			query("SELECT nick FROM users WHERE user_id=?", [socket.user_id]);
			socket.user_nick = nick[0].nick;
			cachePool.set(`${socket.user_id}nick`, socket.user_nick, 60);
		}
	}
	next();
});

/**
 * 分离URL,根据权限分离用户
 */

io.use((socket, next) => {
	const pos = onlineUser[socket.user_id];
	const referer = socket.handshake.headers.referer || "";
	const origin = socket.handshake.headers.origin || "";
	const _url = referer.substring(origin.length || referer.indexOf("/", 9));
	if (_url.length && _url.length > 0) {
		socket.url = _url;
	}
	if (pos !== null && pos !== undefined && pos && pos.url) {
		if (_url.length > 0) {
			pos.url.push(_url);
		}
		user_socket[socket.user_id].push(socket);
		if (socket.privilege) {
			admin_user[socket.user_id].push(socket);
		} else {
			normal_user[socket.user_id].push(socket);
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
		user_socket[socket.user_id] = [socket];
		onlineUser[socket.user_id] = user;
		if (socket.privilege) {
			admin_user[socket.user_id] = [socket];
		} else {
			normal_user[socket.user_id] = [socket];
		}
	}
	onlineUserBroadcast();
	next();
});
/**
 * 处理URL包含的信息
 */

io.use((socket, next) => {
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
			pagePush.status.push(socket);
			socket.status = true;
		}
	}
	next();
});
/**
 * Socket获得连接
 */
io.on("connection", async function (socket) {
	socket.on("auth", function (data) {
		if (!socket.send_auth && socket.auth) {
			socket.send_auth = true;
			const pos = onlineUser[socket.user_id];
			pos.identity = socket.privilege ? "admin" : "normal";
			pos.intranet_ip = pos.intranet_ip || data["intranet_ip"] || socket.handshake.address || "未知";
			pos.ip = pos.ip || data["ip"] || "";
			pos.version = data["version"] || "";
			pos.platform = data["platform"] || "";
			pos.browser_core = data["browser_core"] || "";
			pos.useragent = data["useragent"] || "";
			pos.screen = data["screen"] || "";
			pos.nick = pos.nick || socket.user_nick || data["nick"];
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

		const response = await submitControl(socket.request, data.val, cookie.parse(socket.handshake.headers.cookie));
		if (!response.solution_id) {
			socket.emit("reject_submit", response);
			return;
		}
		data.submission_id = response.solution_id;
		const ip = onlineUser[socket.user_id].ip;
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
		submissions[submission_id] = socket;
		const avatar = await cache_query("select avatar from users where user_id = ?", [data.user_id]);
		submitUserInfo[submission_id] = {
			nick: data.nick,
			user_id: data.user_id,
			in_date: new Date().toISOString(),
			avatar: !!avatar[0].avatar
		};
		data.val.avatar = !!avatar[0].avatar;
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
		switch (language) {
		case 15:
		case 22:
			dockerRunner.addTask(data);
			break;
		default:
			localJudge.addTask(data.submission_id, socket.privilege);
		}
		sendMessage(admin_user, "judger", localJudge.getStatus());
	});
	/**
	 * 全局推送功能
	 */
	socket.on("msg", function (data) {
		socket.broadcast.emit("msg", data);
		socket.emit("msg", data);
	});
	/**
	 * 聊天功能，向目标用户发送聊天信息
	 */

	socket.on("chat", function (data) {
		const toPersonUser_id = data.to;
		if (user_socket[toPersonUser_id] && user_socket[toPersonUser_id].emit) {
			sendMessage(user_socket[toPersonUser_id], "chat", {
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
	/**
	 * 断开连接销毁所有保存的数据
	 */
	socket.on("disconnect", function () {
		const user_id = socket.user_id;
		let pos = onlineUser[user_id];
		if (pos && !socket.hasClosed) {
			socket.hasClosed = true;
			if (whiteboard.has(socket)) {
				whiteboard.delete(socket);
			}
			let url_pos = pos.url.indexOf(socket.url);
			if (~url_pos)
				pos.url.splice(url_pos, 1);
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
			let socket_pos;
			if (socket.privilege) {
				socket_pos = admin_user[user_id].indexOf(socket);
				if (~socket_pos)
					admin_user[user_id].splice(socket_pos, 1);
			} else {
				socket_pos = normal_user[user_id].indexOf(socket);
				if (~socket_pos)
					normal_user[user_id].splice(socket_pos, 1);
			}
			if (!pos.url.length) {
				delete user_socket[user_id];
				delete onlineUser[user_id];
				if (admin_user[user_id]) {
					delete admin_user[user_id];
				}
				if (normal_user[user_id]) {
					delete normal_user[user_id];
				}
			}
			onlineUserBroadcast();
		}
	});
});

if (ENVIRONMENT === "autotest") {
	process.exit(0);
}
