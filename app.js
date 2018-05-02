const express = require("express");
const session = require("express-session");
const compression = require("compression");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const performance = require("./middleware/performance");
const helmet = require("helmet");
const log4js = require("./module/logger");
const log = log4js.logger("cheese", "info");
const sessionMiddleware = require("./module/session").sessionMiddleware;
global.Application = app;
const oneDay = 86400000;
app.use(performance);
app.use(log4js.connectLogger(log, {level: "info"}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.set("view cache", true);
app.use("/static", express.static(__dirname + "/static", {
	maxAge: oneDay * 30
}));
app.use(sessionMiddleware);

app.use(compression());

const expiryDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
app.use(session({
	name: "session",
	keys: ["maybeyoucannotguess", "whatthiskeyitis"],
	cookie: {
		httpOnly: true,
		expires: expiryDate
	}
})
);
app.use(logger("dev"));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: false}));
app.use(cookieParser());
const routerDir = path.join(__dirname, "routes");
const routerFiles = fs.readdirSync(routerDir);
routerFiles.forEach(fileName => {
	const routerArray = require(path.join(routerDir, fileName));
	if (typeof routerArray !== "undefined" && routerArray.length > 1 && typeof routerArray[0] === "string" && routerArray[0].match(/^\/[\s\S]*/).length > 0) {
		app.use(...routerArray);
	}
});
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
