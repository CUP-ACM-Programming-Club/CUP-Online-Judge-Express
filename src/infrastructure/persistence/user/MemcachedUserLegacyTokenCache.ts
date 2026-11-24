import { UserLegacyTokenCache } from "../../../application/ports/UserTokenStore";
const memcache = require("../../cache/memcached");

export class MemcachedUserLegacyTokenCache implements UserLegacyTokenCache {
	get(key: string) {
		return memcache.get(key);
	}
}
