const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const Random = require("meteor-random");
const redisClient = require("./redis").default;
const secretKey = global.config.session_secret || Random.secret(128);
const oneDay = 86400000;
const sessionMiddleware = session({
	store: new RedisStore({ client: redisClient }),
	saveUninitialized: false,
	ttl: oneDay * 31 * 12,
	resave: false,
	secret: secretKey,
	cookie: {
		maxAge: oneDay * 31 * 12
	}
});

module.exports.sessionMiddleware = sessionMiddleware;
module.exports.sessionStore = RedisStore;
