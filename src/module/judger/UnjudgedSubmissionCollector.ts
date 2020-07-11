import {localJudger} from "../judger";
import {MySQLManager} from "../../manager/mysql/MySQLManager";
import { ConfigManager } from "../config/config-manager";
import dayjs from "dayjs";
const DEFAULT_LOOP_SECONDS = 3000;
const SUBMISSION_COLLECT_LIMIT = 30;

class UnjudgedSubmissionCollector {
    private judger?: localJudger;
    private interval?: NodeJS.Timeout;
    private collectFinished?: boolean;

    setJudger(judger: localJudger) {
        this.judger = judger;
        return this;
    }

    start () {
        if (!this.interval) {
            this.collectFinished = true;
            this.interval = setInterval(() => {
                if (ConfigManager.isSwitchedOn("enable_judge_collector", ConfigManager.SWITCH_ON)) {
                    this.collectHandler();
                }
            }, ConfigManager.getConfig("judger_loop_time", DEFAULT_LOOP_SECONDS));
        }
    }

    async collectHandler () {
        try {
            this.collectFinished = false;
            const result = await MySQLManager.execQuery("SELECT solution_id,user_id FROM solution WHERE result<2 and language not in (15,22) and problem_id != 0 order by solution_id limit ?", [ConfigManager.getConfig("submission_collect_limit", SUBMISSION_COLLECT_LIMIT)]);
            for (let i in result) {
                if (!Object.prototype.hasOwnProperty.call(result,i)) {
                    continue;
                }
                const _data = await MySQLManager.execQuery("SELECT count(1) as cnt from privilege where user_id = ? and rightstr = 'administrator'",
                    [result[i].user_id]);
                const admin = !!(_data && _data.length && _data[0].cnt);
                const solutionId = parseInt(result[i].solution_id);
                const priority = parseInt(String(!!result[i].result));
                console.log(`Current Time: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}, solutionId: ${solutionId}`);
                this.judger!.addTask(solutionId, admin, false, (priority + 1) % 2);
            }
        }
        catch (e) {
            console.log(e);
        }
        this.collectFinished = true;
    }

    stop () {
        if (this.interval) {
            clearInterval(this.interval);
            return true;
        }
        return false;
    }

    newInstance () {
        return new UnjudgedSubmissionCollector();
    }
}

export default new UnjudgedSubmissionCollector();
