import session from "express-session";
// @ts-ignore
import connectRedis from "connect-redis";
// @ts-ignore
import Random from "meteor-random";
import redisClient from "./redis";
import { Request, Response, NextFunction } from "express";

const RedisStore = connectRedis(session);
// @ts-ignore
const config = global.config;
const secretKey = config.session_secret || Random.secret(128);
const oneDay = 86400000;

const sessionMiddleware = function (req: Request, res: Response, next: NextFunction) {
	const host = req && req.get && req.get("host");
	const domain = config.cookie ? config.cookie.domain : null;

	// Helper to create store options
	const storeOptions = { client: redisClient };

	// Cookie options
	const cookieOptions = {
		maxAge: oneDay * 31
	};

	if (typeof host === "string" && domain && host.includes(domain)) {
		Object.assign(cookieOptions, config.cookie);
	}

	return session({
		store: new RedisStore(storeOptions),
		saveUninitialized: false,
		ttl: oneDay * 31,
		resave: false,
		secret: secretKey,
		cookie: cookieOptions
	} as any)(req, res, next);
};

export { sessionMiddleware };
export const sessionStore = RedisStore;
