/**
 * 每个网页 websocket 连接上的事件处理（在线用户、提交、站内推送、聊天、白板、断开清理）。
 * 原先写在 bin/main.ts 的 io.on("connection") 里，行为保持不变。
 */
import { UserSocket } from "../Socket";
import OnlineUserSet from "../set/OnlineUserSet";
import NormalUserSet from "../set/NormalUserSet";
import AdminUserSet from "../set/AdminUserSet";
import SocketSet from "../set/SocketSet";
import UserSocketSet from "../set/UserSocketSet";
import ContestPagePushSet from "../set/ContestPagePushSet";
import StatusSet from "../singleton/StatusSet";
import BroadcastManager from "../managers/BroadcastManager";
import OnlineUserBroadcast from "../managers/OnlineUserBroadcast";
import { buildSocket } from "../BuildSocketStatus";
import whiteboard from "../whiteboard/SocketSet";
import { handleSubmit } from "./SubmitHandler";

export function removeStatus(socket: UserSocket) {
	const contest_id = socket.contest_id;
	if (contest_id) {
		ContestPagePushSet.removeFromList(contest_id);
	}
	if (socket.status) {
		StatusSet.remove(socket);
	}
}

function whiteBoardBroadCast(socket: UserSocket, content: string) {
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

function onAuth(socket: UserSocket, data: any) {
	if (!socket.send_auth && socket.auth) {
		socket.send_auth = true;
		const pos = OnlineUserSet.get(socket.user_id!);
		pos.identity = socket.privilege ? "admin" : "normal";
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
}

function onUpdateURL(socket: UserSocket, data: any) {
	removeStatus(socket);
	const user = OnlineUserSet.get(socket.user_id!);
	user.lastUpdated = Date.now();
	const pos = user.url.indexOf(socket.url);
	if (pos !== -1) {
		user.url[pos] = data.url;
	}
	socket.url = data.url;
	buildSocket(socket);
	OnlineUserBroadcast.broadcast();
}

/** 全站推送：内容会作为 HTML 在所有接收者浏览器里渲染，只允许管理员发 */
function onMsg(socket: UserSocket, data: any) {
	if (!socket.privilege) {
		return;
	}
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
}

/** 聊天：发给目标用户的所有连接 */
function onChat(data: any) {
	const userSocketList = UserSocketSet.get(data.to);
	if (userSocketList && userSocketList.length && userSocketList.length > 0 && userSocketList[0].emit) {
		BroadcastManager.sendMessage(userSocketList, "chat", {
			from: data.from,
			content: data.content,
			time: Date.now().toString()
		});
	}
}

function onWhiteboard(socket: UserSocket, data: any) {
	if (data.request === "register" && !whiteboard.has(socket)) {
		whiteboard.add(socket);
	} else if (data.request === "text") {
		whiteBoardBroadCast(socket, data.content);
	}
}

/** 断开连接：清掉这个连接在各个集合里的记录 */
function onDisconnect(socket: UserSocket) {
	const userId = socket.user_id!;
	const pos = OnlineUserSet.get(userId);
	if (pos && !socket.hasClosed) {
		socket.hasClosed = true;
		if (whiteboard.has(socket)) {
			whiteboard.delete(socket);
		}
		SocketSet.remove(socket.currentTimeStamp!.toString());
		const url_pos = pos.url.indexOf(socket.url);
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
}

export function registerConnectionHandlers(socket: UserSocket) {
	socket.on("auth", (data: any) => onAuth(socket, data));
	socket.on("getUser", () => OnlineUserBroadcast.broadcast());
	socket.on("updateURL", (data: any) => onUpdateURL(socket, data));
	socket.on("status", () => {
		// deprecated
	});
	socket.on("submit", (data: any) => handleSubmit(socket, data));
	socket.on("msg", (data: any) => onMsg(socket, data));
	socket.on("chat", (data: any) => onChat(data));
	socket.on("whiteboard", (data: any) => onWhiteboard(socket, data));
	socket.on("disconnect", () => onDisconnect(socket));
}
