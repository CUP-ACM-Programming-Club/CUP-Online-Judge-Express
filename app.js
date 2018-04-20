const express = require("express");
const session = require("express-session");
const compression = require("compression");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const index = require("./routes/index");
const homepage = require("./routes/homepage");
const problem = require("./routes/problem");
const user = require("./routes/user");
const test = require("./routes/test");
const status = require("./routes/status");
const login = require("./routes/login");
const logout = require("./routes/logout");
const faq = require("./routes/faq");
const exp = require("./routes/export_rpk");
const ranklist = require("./routes/ranklist");
const problemset = require("./routes/problemset");
const upload = require("./routes/upload");
const auth = require("./middleware/auth");
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
app.use("/", index);
app.use("/homepage", homepage);
app.use("/problem", auth, problem);
app.use("/problemset", auth, problemset);
app.use("/user", auth, user);
app.use("/test", test);
app.use("/login", login);
app.use("/logout", auth, logout);
app.use("/status", auth, status);
app.use("/faq", auth, faq);
app.use("/ranklist", auth, ranklist);
app.use("/upload", auth, upload);
app.use("/export", auth, exp);
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