const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const Random = require("meteor-random");
const redisClient = require("./redis").default;
const secretKey = global.config.session_secret || Random.secret(128);
const oneDay = 86400000;
const sessionMiddleware = function (req, res, next) {
	const host = req && req.get && req.get("host");
	if (typeof host === "string" && host.includes(global.config.cookie.domain || null)) {
		return session({
			store: new RedisStore({ client: redisClient }),
			saveUninitialized: false,
			ttl: oneDay * 31,
			resave: false,
			secret: secretKey,
			cookie: Object.assign({
				maxAge: oneDay * 31
			}, global.config.cookie)
		})(req, res, next);
	}
	return session({
		store: new RedisStore({ client: redisClient }),
		saveUninitialized: false,
		ttl: oneDay * 31,
		resave: false,
		secret: secretKey,
		cookie: {
			maxAge: oneDay * 31
		}
	})(req, res, next);
};

module.exports.sessionMiddleware = sessionMiddleware;
module.exports.sessionStore = RedisStore;
