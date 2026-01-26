import path from "path";
import fs from "fs";
import Module from "module";
import ts from "typescript";

process.env.NODE_ENV = "autotest";
global.unit_test = "autotest";
if (!global.config) {
	let baseConfig = {};
	try {
		const configPath = path.resolve(__dirname, "..", "..", "..", "config-sample.json");
		baseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
	} catch {
		baseConfig = {};
	}
	global.config = Object.assign({}, baseConfig, {
		webhook: { secret: "test-secret" },
		cookie: Object.assign({ domain: "" }, baseConfig.cookie || {}),
		session_secret: baseConfig.session_secret || "test-secret",
		salt: baseConfig.salt || "testsalt",
		problem_upload_dest: {
			dir: path.resolve(__dirname, "test_upload_dir")
		}
	});
}

require("ts-node/register/transpile-only");

const projectRoot = path.resolve(__dirname, "..", "..");
const origJs = require.extensions[".js"];

require.extensions[".js"] = function (module, filename) {
	if (filename.startsWith(projectRoot)) {
		const content = fs.readFileSync(filename, "utf8");
		if (/^\s*(import|export)\s/m.test(content)) {
			const output = ts.transpileModule(content, {
				compilerOptions: {
					allowJs: true,
					esModuleInterop: true,
					module: ts.ModuleKind.CommonJS,
					target: ts.ScriptTarget.ES2019
				}
			});
			return module._compile(output.outputText, filename);
		}
	}
	return origJs(module, filename);
};

import fakeDb from "../mocks/fake-db";

function createModelStub() {
	class Model {
		static sync() {
			return Promise.resolve();
		}
		static upsert() {
			return Promise.resolve();
		}
		static findOne() {
			return Promise.resolve(null);
		}
		static destroy() {
			return Promise.resolve(0);
		}
		static findAll() {
			return Promise.resolve([]);
		}
		static create() {
			return Promise.resolve();
		}
		static findByPk() {
			return Promise.resolve(null);
		}
	}
	return Model;
}

const modelProxy = new Proxy({}, {
	get(target, prop) {
		if (!target[prop]) {
			target[prop] = createModelStub();
		}
		return target[prop];
	}
});

const mockMysqlQuery = Object.assign(function (sql, params, callback) {
	console.log("MockMysqlQuery called:", sql);
	return fakeDb.query(sql, params, callback);
}, { pool: fakeDb.pool });

const mockMysqlCache = Object.assign(function (sql, params, callback) {
	return fakeDb.query(sql, params, callback);
}, { pool: fakeDb.pool });

const mockMySQLManager = {
	mysqlPool: fakeDb.pool,
	execQuery: mockMysqlQuery,
	transaction: fakeDb.transaction
};

const mockSequelize = {
	close() {
		return Promise.resolve();
	},
	import(name) {
		return modelProxy[name];
	}
};

const mockRedisClient = {
	lrangeAsync() {
		return ["test"];
	},
	rpushAsync() {
		return ["test"];
	},
	hmsetAsync() {
		return Promise.resolve();
	},
	hgetAsync() {
		return Promise.resolve(null);
	},
	hdelAsync() {
		return Promise.resolve(0);
	},
	hgetallAsync() {
		return Promise.resolve({});
	},
	llenAsync() {
		return Promise.resolve(0);
	},
	lpopAsync() {
		return Promise.resolve(null);
	},
	quit() {
	},
	hmset() {
	}
};

const mockRedisModule = Object.assign({ default: mockRedisClient }, mockRedisClient);

const mockMemcachedModule = {
	get() {
		return Promise.resolve(null);
	},
	instance: {}
};

const mockBuildEnv = function () {
	global.config = global.config || {};
	return Promise.resolve();
};

const mockCacheScheduler = {
	addCacheContainer() {
	}
};

const overrides = new Map();
const srcRoot = projectRoot;

function registerOverride(filePath: string, mockValue: any) {
	overrides.set(path.resolve(filePath), mockValue);
}

registerOverride(path.join(srcRoot, "module", "mysql_query.ts"), mockMysqlQuery);
registerOverride(path.join(srcRoot, "module", "mysql_cache.ts"), mockMysqlCache);
registerOverride(path.join(srcRoot, "manager", "mysql", "MySQLManager.ts"), { MySQLManager: mockMySQLManager });
registerOverride(path.join(srcRoot, "orm", "instance", "sequelize.ts"), mockSequelize);
registerOverride(path.join(srcRoot, "orm", "ts-model", "index.ts"), modelProxy);
registerOverride(path.join(srcRoot, "module", "memcached.ts"), mockMemcachedModule);
registerOverride(path.join(srcRoot, "module", "init", "build_env.ts"), mockBuildEnv);
registerOverride(path.join(srcRoot, "module", "redis.ts"), mockRedisModule);
registerOverride(path.join(srcRoot, "module", "redis.ts"), mockRedisModule);
registerOverride(path.join(srcRoot, "manager", "cache", "scheduler", "CacheScheduler.ts"), mockCacheScheduler);
registerOverride(path.join(srcRoot, "manager", "user", "UserRegisterManager.ts"), {
	UserRegisterValidator: class {
		async validate(payload: any) { }
		async validateWithoutInviteCode(payload: any) { }
	},
	UserRegisterManager: class {
		userRegisterValidator: any;
		constructor() {
			this.userRegisterValidator = {
				validate: async () => { },
				validateWithoutInviteCode: async () => { }
			};
		}
		async registerUserRequest(req: any) { return { status: "OK" }; }
		async initSystemAdminUserRequest(req: any) { }
	},
	default: {
		registerUserRequest: () => Promise.resolve({ status: "OK" })
	}
});
registerOverride(path.join(srcRoot, "manager", "init", "InitManager.ts"), {
	default: {
		setInitFlag: () => { }
	}
});

const originalLoad = (Module as any)._load;
(Module as any)._load = function (request: any, parent: any, isMain: any) {
	if (request === "log4js") {
		const noop = function () { };
		return {
			getLogger() {
				return {
					info: noop,
					debug: noop,
					warn: noop,
					error: noop,
					fatal: noop
				};
			},
			configure: noop,
			connectLogger() {
				return (req, res, next) => next();
			}
		};
	}
	if (request === "express-status-monitor") {
		return function () {
			return (req, res, next) => next();
		};
	}
	if (request === "socket.io-client") {
		return function () {
			const handlers = {};
			return {
				connected: false,
				on(event, handler) {
					handlers[event] = handler;
				},
				emit() {
				}
			};
		};
	}
	if (request === "socket.io") {
		return function () {
			return {
				on() {
				},
				emit() {
				},
				close() {
				}
			};
		};
	}
	if (request === "connect-redis") {
		return function (session) {
			const shared = global.__sessionStore || new session.MemoryStore();
			global.__sessionStore = shared;
			return class RedisStore extends session.MemoryStore {
				constructor() {
					super();
					this.sessions = shared.sessions;
				}
			};
		};
	}
	const resolved = (Module as any)._resolveFilename(request, parent, isMain);
	if (overrides.has(resolved)) {
		return overrides.get(resolved);
	}
	return originalLoad(request, parent, isMain);
};

if (typeof process.send !== "function") {
	process.send = function () {
	};
}
