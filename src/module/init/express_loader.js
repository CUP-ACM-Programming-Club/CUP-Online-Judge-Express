const log4js = require("../../module/logger");
const log = log4js.logger("cheese", "info");
module.exports = (app, io = undefined) => {
	if(io !== undefined) {
		app.use(require("express-status-monitor")({
			websocket: io,
			path: "/monitor"
		}));
	}
	require("../router_loader")(app);
	app.use((req, res) => {
		log.fatal(`Error URL: ${req.originalUrl}`);
		let obj = {
			status: "error",
			statement: "resource not found"
		};
		res.json(obj);
	});
};
