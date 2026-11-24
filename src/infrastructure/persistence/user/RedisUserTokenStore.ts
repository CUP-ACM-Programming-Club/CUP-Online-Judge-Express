import client from "../../redis/redis";
import { UserTokenStore } from "../../../application/ports/UserTokenStore";

export class RedisUserTokenStore implements UserTokenStore {
	llen(key: string) {
		return client.llenAsync(key);
	}

	lpop(key: string) {
		return client.lpopAsync(key);
	}

	rpush(key: string, value: string) {
		return client.rpushAsync(key, value);
	}

	lrangeAll(key: string) {
		return client.lrangeAsync(key, 0, -1);
	}
}
