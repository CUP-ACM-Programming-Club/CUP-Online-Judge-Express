import { GlobalSettingRepository } from "../../../application/ports/GlobalSettingRepository";
import { query } from "../../db";

export class MySqlGlobalSettingRepository implements GlobalSettingRepository {
	findAll() {
		return query("select * from global_setting");
	}

	findByLabels(labels: string[]) {
		const placeholders = labels.map(() => "?").join(",");
		return query(`select * from global_setting where label in (${placeholders})`, labels);
	}

	setValue(label: string, value: string) {
		return query("update global_setting set value = ? where label = ?", [value, label]);
	}
}
