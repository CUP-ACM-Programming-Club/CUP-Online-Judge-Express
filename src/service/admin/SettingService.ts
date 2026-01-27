
import query from "../../module/mysql_query";

class SettingService {
    async getSetting(label: any = []) {
        if (label.length === 0) {
            return await query("select * from global_setting");
        } else {
            // Using query directly but we should probably use parameters if possible
            // But here label is an array of strings. 
            // Original code: `where label in (${label.join(",")})`
            // If label contains malicious strings, it's SQLi.
            // But this is admin route. 
            // Let's improve it by using parameterized query if possible, or at least quoting.
            // But `mysql_query` helper might not support `IN (?)` with array directly depending on mysql driver version.
            // Let's keep original logic for now but wrapped in service.

            // To be safer, we can map to ? and pass array
            const placeholders = label.map(() => "?").join(",");
            return await query(`select * from global_setting where label in (${placeholders})`, label);
        }
    }

    async setSetting(label: string, value: string) {
        if (typeof label !== "string" || typeof value !== "string") {
            return false;
        }
        await query("update global_setting set value = ? where label = ?", [value, label]);
        return true;
    }
}

export default new SettingService();
