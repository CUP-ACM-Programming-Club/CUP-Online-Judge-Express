const client = require("../../../redis");
const BaseStore = require("./base-store");
const inheritPrototype = require("../../../util/InheritPrototype");
module.exports = function (hashMapKey) {
	function RedisStore() {

	}
	inheritPrototype(RedisStore, BaseStore);

	RedisStore.prototype.set = function (payload) {
		const payloadArray = Object.keys(payload)
			.map(key => [key, payload[key]]);
		return client.hmsetAsync(hashMapKey, payloadArray);
	};

	RedisStore.prototype.get = function (payload) {
		return client.hgetAsync(hashMapKey, payload);
	};

	RedisStore.prototype.getAll = function () {
		return client.hgetallAsync(hashMapKey);
	};

	return RedisStore;
};
