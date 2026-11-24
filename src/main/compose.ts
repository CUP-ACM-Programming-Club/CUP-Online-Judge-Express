/**
 * 组装根：把 infrastructure 里的实现绑定到 application 声明的端口上。
 * 进程入口（bin/main、bin/websocket）和测试 setup 最先 import 这个文件。
 *
 * 实现模块用 lazy() 延迟加载：有些实现在 import 时就要读 global.config / 连数据库，
 * 延迟到第一次调用端口时才加载，入口里 import 的先后顺序就不重要了。
 */
import { bindPort } from "../application/ports/registry";
import { loggerFactory } from "../application/ports/Logger";
import { ConfigManager as configPort } from "../application/ports/Config";
import { lazy } from "./compose/lazy";
export { lazy };


bindPort(loggerFactory, lazy(() => require("../infrastructure/logging/logger")));
bindPort(configPort, lazy(() => require("../infrastructure/config/config-manager").ConfigManager));

// ---- 各领域的端口绑定 ----
import "./compose/user";
import "./compose/contest";
import "./compose/problem";
import "./compose/submission";
import "./compose/system";
