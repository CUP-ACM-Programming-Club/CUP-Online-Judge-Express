const log4js = require("../../module/logger");
const log = log4js.logger("cheese", "info");
module.exports = (app, io = undefined) => {
	if(io !== undefined) {
		app.use(require("express-status-monitor")({
			websocket: io,
			path: "/monitor"
		}));
	}
	require("../../module/router_loader")(app);
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
};
