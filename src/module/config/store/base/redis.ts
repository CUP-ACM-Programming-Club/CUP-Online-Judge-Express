const client = require("../../../redis");
import {BaseStore} from "./base-store";
export default function (hashMapKey: string) {
	class RedisStore extends BaseStore{
		set(payload: any) {
			const payloadArray = Object.keys(payload)
				.map(key => [key, payload[key]]);
			return client.hmsetAsync(hashMapKey, payloadArray);
		}

		get(payload: any) {
			return client.hgetAsync(hashMapKey, payload);
		}

		getAll() {
			return client.hgetallAsync(hashMapKey);
		}
	}
	return RedisStore;
};
