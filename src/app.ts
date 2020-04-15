import express from "express";
import tracer from "./middleware/tracer";
import path from "path";
const compression = require("compression");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const performance = require("./middleware/http_header");
const GithubWebHook = require("express-github-webhook");
const config = global.config;
const webhookHandler = GithubWebHook({ path: "/webhook", secret: config.webhook.secret });
const helmet = require("helmet");
const log4js = require("./module/logger");
const log = log4js.logger("cheese", "info");
const sessionMiddleware = require("./module/session").sessionMiddleware;
global.Application = app;
app.use(performance);
app.use(log4js.connectLogger(log, {level: "info"}));
app.set("views", path.join(process.cwd(), "views"));
app.set("view engine", "pug");
app.set("view cache", true);
/*
const epf = require("express-php-fpm");

const options = {
	// root of your php files
	documentRoot: "path/to/php_files",

	// extra env variables
	env: {},

	// connection to your php-fpm server
	// https://nodejs.org/api/net.html#net_socket_connect_options_connectlistener
	socketOptions: {port: 9000},
};
*/

app.use(compression());
app.use(logger("dev"));
app.use(helmet());
app.use(require("request-ip").mw());
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true}));
app.use(cookieParser());
app.use(webhookHandler);
app.use(sessionMiddleware);
// @ts-ignore
app.use(tracer);
// app.use("/",epf(options));

export = app;
