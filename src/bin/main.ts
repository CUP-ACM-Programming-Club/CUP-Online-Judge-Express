import "../main/compose";
/* eslint-disable no-console */
/* eslint-disable require-atomic-updates */

const ENVIRONMENT = process.env.NODE_ENV;
const config = global.config;
import UserValidatorMiddleware from "../interfaces/websocket/UserValidatorMiddleware";
import BindUserInfo from "../interfaces/websocket/BindUserInfo";
require("debug")("express:server");
const log4js = require("../infrastructure/logging/logger");
const logger = log4js.logger("normal", "info");
let port: number | string;
import localJudge from "../infrastructure/judger/localJudger";
import UnjudgedSubmissionCollector from "../application/judging/UnjudgedSubmissionCollector";
import initEnv from "../interfaces/http/middleware/init_env";
import { app, server } from "../main/init/http-server";
if (process.env.MODE === "websocket") {
	port = process.env.PORT || config.ws.websocket_client_port;
	const RuntimeErrorHandler = require("../application/judging/RuntimeErrorHandler");
	localJudge.setErrorHandler(new RuntimeErrorHandler());
	UnjudgedSubmissionCollector.setJudger(localJudge).start();
} else {
	port = process.env.PORT || config.ws.http_client_port;
	app.use(initEnv);
}
const sessionMiddleware = require("../infrastructure/session/session").sessionMiddleware;
import { ConfigManager } from "../infrastructure/config/config-manager";
import NormalUserSet from "../interfaces/websocket/set/NormalUserSet";
import AdminUserSet from "../interfaces/websocket/set/AdminUserSet";
import SubmissionSet from "../interfaces/websocket/set/SubmissionSet";
import BroadcastManager from "../interfaces/websocket/managers/BroadcastManager";
import UserSetCollector from "../interfaces/websocket/UserSetCollector";
import BuildSocketStatus from "../interfaces/websocket/BuildSocketStatus";
import { registerConnectionHandlers } from "../interfaces/websocket/handlers/ConnectionHandlers";
import InitExternalEnvironment from "../main/init/InitExternalEnvironment";
import io from "../main/init/socket-server";
InitExternalEnvironment.run();
ConfigManager.useMySQLStore().initConfigMap().initSwitchMap();
// 原先由 admin/system/hot-reload 路由在加载时顺带注册（worker 退出时的 safe-exit 钩子）；路由改走端口后在这里显式加载
require("../main/cluster/hot-reload");
require("../main/init/express_loader")(app, io);

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


localJudge.on("change", (freeJudger: any) => {
	BroadcastManager.sendMessage(NormalUserSet.getInnerStorage(), "judgerChange", freeJudger);
	BroadcastManager.sendMessage(AdminUserSet.getInnerStorage(), "judgerChange", freeJudger);
	BroadcastManager.sendMessage(NormalUserSet.getInnerStorage(), "freeJudgerNumber", { num: freeJudger.length });
	BroadcastManager.sendMessage(AdminUserSet.getInnerStorage(), "freeJudgerNumber", { num: freeJudger.length });
});

/**
 * 从ExpressJS提取Session信息，将Session与当前的Socket绑定
 */

io.use((socket: any, next: any) => {
	// socket.io v4 no longer exposes a response object on the handshake request;
	// express-session only needs a stub here (documented v4 pattern).
	sessionMiddleware(socket.request, socket.request.res || {}, next);
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
io.on("connection", registerConnectionHandlers);

if (ENVIRONMENT === "autotest") {
	process.exit(0);
}
