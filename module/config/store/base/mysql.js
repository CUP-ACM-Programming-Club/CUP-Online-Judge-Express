const dayjs = require("dayjs");
const {BaseStore, inheritPrototype} = require("./base-store");
module.exports = function (Model) {
	function MySQLStore() {
	}

	inheritPrototype(MySQLStore, BaseStore);

	MySQLStore.prototype.set = function (payload) {
		return Model.upsert(Object.assign(payload, {modify_time: dayjs().format("YYYY-MM-DD HH:mm:ss")}));
	};

	MySQLStore.prototype.get = function (key) {
		return Model.findOne({where: key});
	};

	MySQLStore.prototype.getAll = function () {
		return Model.findAll();
	};

	return MySQLStore;
};
