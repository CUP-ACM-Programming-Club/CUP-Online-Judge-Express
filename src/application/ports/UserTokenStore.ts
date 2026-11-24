import { definePort } from "./registry";

/** 登录 token 列表（Redis list）。实现：infrastructure/persistence/user/RedisUserTokenStore */
export interface UserTokenStore {
	llen(key: string): Promise<number>;
	lpop(key: string): Promise<any>;
	rpush(key: string, value: string): Promise<any>;
	/** 整个列表（lrange key 0 -1） */
	lrangeAll(key: string): Promise<string[]>;
}

export const userTokenStore = definePort<UserTokenStore>("UserTokenStore");

/** 旧版 memcached 登录 token。实现：infrastructure/persistence/user/MemcachedUserLegacyTokenCache */
export interface UserLegacyTokenCache {
	get(key: string): Promise<any>;
}

export const userLegacyTokenCache = definePort<UserLegacyTokenCache>("UserLegacyTokenCache");
