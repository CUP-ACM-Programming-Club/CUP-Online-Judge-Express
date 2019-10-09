const config = global.config;
module.exports = {
	port: process.env.DASH_PORT || config.monitor.port,
	url: "/monitor",
	middleware: (req, res, next) => {
		if (req.originalUrl === "/") {
			res.redirect("/monitor");
		} else {
			return next();
		}
	}
};
