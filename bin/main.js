const app = require("../app");
require("debug")("express:server");
const log4js = require("../module/logger");
const logger = log4js.logger("normal", "info");
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = process.env.PORT || 3000;
const query = require("../module/mysql_query");
const cachePool = require("../module/cachePool");
const cookie = require("cookie");
const sessionMiddleware = require("../module/session").sessionMiddleware;
const client = require("../module/redis");
server.listen(port, function () {
	logger.info("Server listening at port %d", port);
});
let onlineUser = {};
let user_socket = {};
let admin_user = {};
let normal_user = {};


function broadcast(userArr, type, val) {
	for (let i in userArr) {
		for (let j in userArr[i]) {
			userArr[i][j].emit(type, val);
		}
	}
}

function privilege_diff_broadcast(socket) {
	let online = Object.values(onlineUser);
	let userArr = {
		user_cnt: online.length
	};
	broadcast(normal_user, "user", userArr);
	if (!socket.privilege) {
		socket.emit("user", userArr);
	}
	userArr["user"] = online;
	broadcast(admin_user, "user", userArr);
	if (socket.privilege) {
		socket.emit("user", userArr);
	}
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
		if (cache_token.indexOf(token) !== -1) {
			privilege_diff_broadcast(socket);
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
	privilege_diff_broadcast(socket);
	next();
});

io.use((socket, next) => {
	const pos = onlineUser[socket.user_id];
	const referer = socket.handshake.headers.referer;
	const origin = socket.handshake.headers.origin;
	const _url = referer.substring(origin.length);
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
		socket.url = data["url"];
		privilege_diff_broadcast(socket);
	});


	socket.on("submit", async function (data) {
		data["user_id"] = socket.user_id || "";
		data["nick"] = socket.user_nick;
		if (typeof data["val"]["cid"] !== "undefined") {
			const id_val = await query("SELECT problem_id FROM contest_problem WHERE contest_id=? and num=?", [data["val"]["cid"], data["val"]["pid"]]);
			data["val"]["id"] = id_val[0].problem_id;
		}
		broadcast(admin_user, "submit", data);
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
		if (pos !== undefined) {
			let url_pos = pos.url.indexOf(socket.url);
			if (url_pos !== -1)
				pos.url.splice(url_pos, 1);
			let socket_pos;
			if (socket.privilege) {
				socket_pos = admin_user[socket.user_id].indexOf(socket);
				if (socket_pos !== -1)
					admin_user[socket.user_id].splice(socket_pos, 1);
			}
			else {
				socket_pos = normal_user[socket.user_id].indexOf(socket);
				if (socket_pos !== -1)
					normal_user[socket.user_id].splice(socket_pos, 1);
			}
			if (pos.url.length === 0) {
				delete user_socket[socket.user_id];
				delete onlineUser[socket.user_id];
				if (admin_user[socket.user_id])
					delete admin_user[socket.user_id];
				if (normal_user[socket.user_id])
					delete normal_user[socket.user_id];
			}
			privilege_diff_broadcast(socket);
		}
	});
})
;
