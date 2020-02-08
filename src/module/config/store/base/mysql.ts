const dayjs = require("dayjs");
import {BaseStore} from "./base-store";
export default function (Model: any) {
	class MySQLStore extends BaseStore {
		set(payload: any) {
			return Model.upsert(Object.assign(payload, {modify_time: dayjs().format("YYYY-MM-DD HH:mm:ss")}));
		}

		get(key: string) {
			return Model.findOne({where: {key}});
		}

		remove(key: string) {
			return Model.destroy({
				where: {key}
			});
		}

		getAll() {
			return Model.findAll();
		}
	}
	return MySQLStore;
};
