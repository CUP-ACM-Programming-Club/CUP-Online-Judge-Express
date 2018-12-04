const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const Random = require("meteor-random");
const secretKey = require("../config.json").session_secret || Random.secret(128);
const oneDay = 86400000;
const sessionMiddleware = session({
	store: new RedisStore,
	saveUninitialized: false,
	ttl: oneDay * 31 * 12 * 100,
	resave: false,
	secret: secretKey,
	cookie: {
		maxAge: 60 * 60 * 1000
	}
});

module.exports.sessionMiddleware = sessionMiddleware;
module.exports.sessionStore = RedisStore;
