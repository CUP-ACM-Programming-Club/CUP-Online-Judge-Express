const express = require("express");
const compression = require("compression");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const performance = require("./middleware/performance");
const helmet = require("helmet");
const log4js = require("./module/logger");
const log = log4js.logger("cheese", "info");
const sessionMiddleware = require("./module/session").sessionMiddleware;
global.Application = app;
app.use(performance);
app.use(log4js.connectLogger(log, {level: "info"}));

app.set("views", path.join(__dirname, "views"));
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

app.use(sessionMiddleware);

app.use(compression());
/*
const expiryDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
app.use(session({
	name: "session",
	keys: ["maybeyoucannotguess", "whatthiskeyitis"],
	cookie: {
		httpOnly: true,
		expires: expiryDate
	}
}));
*/
app.use(logger("dev"));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: false}));
app.use(cookieParser());
require("./module/router_loader")(app);
// app.use("/",epf(options));
app.use((req, res, next) => {
	let err = new Error("Not Found");
	err.status = 404;
	next(err);
});

app.use((err, req, res) => {
	log.fatal(err);
	let obj = {
		status: "ERROR",
		statement: "resource not found"
	};
	res.json(obj);
});


module.exports = app;
