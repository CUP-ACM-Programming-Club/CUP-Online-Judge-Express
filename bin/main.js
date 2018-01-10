/* eslint-disable no-console */
const app = require("../app");
require("debug")("express:server");
const log4js = require("../module/logger");
const config = require("../config.json");
const logger = log4js.logger("normal", "info");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || config.ws.client_port;
const query = require("../module/mysql_query");
const cachePool = require("../module/cachePool");
const cookie = require("cookie");
const sessionMiddleware = require("../module/session").sessionMiddleware;
const client = require("../module/redis");
const WebSocket = require("ws");
const _localJudge = require("../module/judger");
const judge_config = config["judger"];
const localJudge = new _localJudge(judge_config["oj_home"], judge_config["oj_judge_num"]);

const wss = new WebSocket.Server({port: config.ws.judger_port});

let onlineUser = {};
let user_socket = {};
let admin_user = {};
let normal_user = {};
let submissions = {};
let page_push = {
	status: [],
	contest_status: []
};

wss.on("connection", function (ws) {
	ws.on("judger", async function (message) {
		const solution_pack = message;
		const finished = parseInt(solution_pack.finish);
		const solution_id = solution_pack.solution_id.toString();
		if (submissions[solution_id])
			await submissions[solution_id].emit("result", solution_pack);
		if (finished) {
			delete submissions[solution_id];
		}
	});
	ws.on("message", async function (message) {
		let request;
		try {
			request = JSON.parse(message);
		}
		catch (e) {
			logger.fatal(`Error:\n
			Error name:${e.name}\n
			Error Message:${e.message}
			`);
			return;
		}
		if (request.type && typeof request.type === "string") {
			ws.emit(request.type, request.value, request);
			console.log(request);
		}
		else {
			logger.fatal(`Error:Parsing message failed.Receive data:${message}`);
		}
	});
});


server.listen(port, function () {
	logger.info("Server listening at port %d", port);
});


function broadcast(userArr, type, val, dimension = 2) {
	if (dimension === 2) {
		for (let i in userArr) {
			for (let j in userArr[i]) {
				userArr[i][j].emit(type, val);
			}
		}
	}
	else if (dimension === 1) {
		for (let i in userArr) {
			userArr[i].emit(type, val);
		}
	}
}

function privilege_diff_broadcast() {
	let online = Object.values(onlineUser);
	let userArr = {
		user_cnt: online.length
	};
	broadcast(normal_user, "user", userArr);
	userArr["user"] = online;
	broadcast(admin_user, "user", userArr);
}


io.use((socket, next) => {
	sessionMiddleware(socket.request, socket.request.res, next);
});


io.use(async (socket, next) => {
	const parse_cookie = cookie.parse(socket.handshake.headers.cookie);
	socket.user_id = parse_cookie["user_id"] || socket.request.session.user_id;
	if (!socket.request.session.auth && !socket.auth) {
		const token = parse_cookie["token"] || "";
		const cache_token = await client.lrangeAsync(`${socket.user_id}token`, 0, -1);
		if (~cache_token.indexOf(token)) {
			privilege_diff_broadcast();
			socket.auth = true;
			next();
		}
		else {
			next(new Error("Auth failed"));
		}
	}
	else {
		next();
	}
})
;

io.use(async (socket, next) => {
	if (socket.privilege === undefined) {
		let _priv;
		if ((_priv = cachePool.get(`${socket.user_id}privilege`))) {
			socket.privilege = parseInt(_priv) > 0;
		}
		else {
			const priv = await
				query("SELECT count(1) as cnt FROM privilege WHERE rightstr='administrator' and " +
					"user_id=?", [socket.user_id]);
			socket.privilege = parseInt(priv[0].cnt) > 0;
			cachePool.set(`${socket.user_id}privilege`, socket.privilege ? "1" : "0", 60);
		}
	}
	if (socket.nick === undefined) {
		let _nick;
		if ((_nick = cachePool.get(`${socket.user_id}nick`))) {
			socket.nick = _nick;
		}
		else {
			const nick = await
				query("SELECT nick FROM users WHERE user_id=?", [socket.user_id]);
			socket.user_nick = nick[0].nick;
			cachePool.set(`${socket.user_id}nick`, socket.user_nick, 60);
		}
	}
	privilege_diff_broadcast();
	next();
});

io.use((socket, next) => {
	const pos = onlineUser[socket.user_id];
	const referer = socket.handshake.headers.referer || "";
	const origin = socket.handshake.headers.origin || "";
	const _url = referer.substring(origin.length || referer.lastIndexOf("/"));
	socket.url = _url;
	if (pos !== undefined) {
		next();
		pos.url.push(_url);
		user_socket[socket.user_id].push(socket);
		if (socket.privilege) {
			admin_user[socket.user_id].push(socket);
		}
		else {
			normal_user[socket.user_id].push(socket);
		}
	}
	else {
		const user = {
			user_id: socket.user_id,
			url: [_url]
		};
		user_socket[socket.user_id] = [socket];
		onlineUser[socket.user_id] = user;
		if (socket.privilege) {
			admin_user[socket.user_id] = [socket];
		}
		else {
			normal_user[socket.user_id] = [socket];
		}
	}
	next();
});

io.use((socket, next) => {
	if (socket.url && ~socket.url.indexOf("status")) {
		if (~socket.url.indexOf("cid")) {
			page_push.contest_status.push(socket);
		}
		else {
			page_push.status.push(socket);
		}
	}
	next();
});

io.on("connection", async function (socket) {
	socket.on("auth", async function (data) {
		const pos = onlineUser[socket.user_id];
		pos.identity = data["id"];
		pos.intranet_ip = data["intranet_ip"];
		pos.ip = data["ip"];
		pos.version = data["version"];
		pos.platform = data["platform"];
		pos.browser_core = data["browser_core"];
		pos.useragent = data["useragent"];
		pos.screen = data["screen"];
		pos.nick = data["nick"];
		socket.url = data["url"];
		privilege_diff_broadcast();
	});


	socket.on("submit", async function (data) {
		data["user_id"] = socket.user_id || "";
		data["nick"] = socket.user_nick;
		const submission_id = data["submission_id"].toString();
		localJudge.addTask(submission_id);
		submissions[submission_id] = socket;
		if (data["val"] && typeof data["val"]["cid"] !== "undefined" && !isNaN(parseInt(data["val"]["cid"]))) {
			const id_val = await query("SELECT problem_id FROM " +
				"contest_problem WHERE contest_id=? and num=?", [data["val"]["cid"], data["val"]["pid"]]);
			if (id_val.length && id_val[0].problem_id)
				data["val"]["id"] = id_val[0].problem_id;
		}
		broadcast((data["val"] && data["val"]["cid"]) ?
			page_push.contest_status : page_push.status, "submit", data, 1);
	});

	socket.on("msg", function (data) {
		socket.broadcast.emit("msg", data);
		socket.emit("msg", data);
	});

	socket.on("chat", function (data) {
		const toPersonUser_id = data["to"];
		broadcast(user_socket[toPersonUser_id], "chat", {
			from: data["from"],
			content: data["content"],
			time: Date.now().toString()
		});
	});

	socket.on("disconnect", function () {
		let pos = onlineUser[socket.user_id];
		if (pos !== undefined && !socket.hasClosed) {
			socket.hasClosed = true;
			let url_pos = pos.url.indexOf(socket.url);
			if (~url_pos)
				pos.url.splice(url_pos, 1);
			let socket_pos;
			if (socket.privilege) {
				socket_pos = admin_user[socket.user_id].indexOf(socket);
				if (~socket_pos)
					admin_user[socket.user_id].splice(socket_pos, 1);
			}
			else {
				socket_pos = normal_user[socket.user_id].indexOf(socket);
				if (~socket_pos)
					normal_user[socket.user_id].splice(socket_pos, 1);
			}
			let page_push_pos;
			if (~(page_push_pos = page_push.status.indexOf(socket))) {
				page_push.status.splice(page_push_pos, 1);
			}
			else if (~(page_push_pos = page_push.contest_status.indexOf(socket))) {
				page_push.contest_status.splice(page_push_pos, 1);
			}
			if (!pos.url.length) {
				delete user_socket[socket.user_id];
				delete onlineUser[socket.user_id];
				if (admin_user[socket.user_id])
					delete admin_user[socket.user_id];
				if (normal_user[socket.user_id])
					delete normal_user[socket.user_id];
			}
			privilege_diff_broadcast();
		}
	});
})
;
