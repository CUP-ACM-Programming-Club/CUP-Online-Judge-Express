import { MySQLManager } from "../../manager/mysql/MySQLManager";

class Heartbeater {
    private interval?: NodeJS.Timeout;
    private minute = 60 * 1000;
    initInterval() {
        if (!this.interval) {
            this.interval = setInterval(() => {
                this.doHeartbeat();
            }, this.minute);
        }
    }

    startHeartbeat() {
        this.initInterval();
    }

    async doHeartbeat() {
        await MySQLManager.execQuery("insert ignore into judge_server(name) values(?)", [global.config.name]);
        await MySQLManager.execQuery("update judge_server set name = ? where name = ?", [global.config.name, global.config.name]);
    }
}

export default new Heartbeater();