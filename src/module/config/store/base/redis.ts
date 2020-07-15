import {PersistenceStore} from "./store";
import {Model} from "sequelize-typescript";
import {config as Config, Switch} from "../../../../orm/ts-model";

const client = require("../../../redis");
export default function<T extends (Config | Switch)> (hashMapKey: string) {
	const RedisStore = function () {

	} as any as {new(): PersistenceStore<T>}

	RedisStore.prototype.set = function (payload: any) {
		const payloadArray = Object.keys(payload)
			.map(key => [key, payload[key]]);
		return client.hmsetAsync(hashMapKey, payloadArray);
	};

	RedisStore.prototype.get = function (key: string) {
		return client.hgetAsync(hashMapKey, key);
	};

	RedisStore.prototype.remove = function (key: string) {
		return client.hdelAsync(hashMapKey, key);
	}

	RedisStore.prototype.getAll = function () {
		return client.hgetallAsync(hashMapKey);
	};

	return RedisStore;
};
