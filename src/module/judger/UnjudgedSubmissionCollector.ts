import {localJudger} from "../judger";
import {MySQLManager} from "../../manager/mysql/MySQLManager";
import { ConfigManager } from "../config/config-manager";
import dayjs from "dayjs";
import Logger from "../console/Logger";
import {wait} from "../../decorator/RetryAsync";
const DEFAULT_LOOP_SECONDS = 3000;
const SUBMISSION_COLLECT_LIMIT = 30;

class UnjudgedSubmissionCollector {
    private judger?: localJudger;
    private interval?: NodeJS.Timeout;
    private collectFinished?: boolean;
    private noDataProblemIdSet = new Set();

    setJudger(judger: localJudger) {
        this.judger = judger;
        return this;
    }

    addNewNoDataProblemId(problemId: number | string) {
        this.noDataProblemIdSet.add(`${problemId}`);
    }

    start () {
        this.collectHandler();
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
            const today = dayjs();
            const yesterday = today.subtract(1, "day").format("YYYY-MM-DD HH:mm:ss");
            const noDataProblemIdList = Array.from(this.noDataProblemIdSet);
            const waitingResult = await MySQLManager.execQuery("SELECT solution_id,user_id FROM solution WHERE result=0 and language not in (15,22) and problem_id != 0 and in_date > '" + yesterday +"' and problem_id not in (?) order by solution_id limit ?", [ConfigManager.getConfig("submission_collect_limit", SUBMISSION_COLLECT_LIMIT), noDataProblemIdList]);
            const rejudgeResult = await MySQLManager.execQuery("SELECT solution_id,user_id FROM solution WHERE result=1 and language not in (15,22) and problem_id != 0 and in_date > '" + yesterday +"' and problem_id not in (?) order by solution_id limit ?", [ConfigManager.getConfig("submission_collect_limit", SUBMISSION_COLLECT_LIMIT), noDataProblemIdList]);
            const result = [...waitingResult, ...rejudgeResult];
            await wait(2000);
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
                await this.judger!.addTask(solutionId, admin, false, (priority + 1) % 2);
            }
        }
        catch (e) {
            const exception = e as unknown as any;
            if (exception && exception.noRetry && exception.solutionId) {
                Logger.log(`e, e.noRetry, e.solutionId: ${exception.solutionId}`);
                await MySQLManager.execQuery("update solution set result=15 where solution_id = ?", [exception.solutionId]);
            }
            Logger.log(`e:${exception}, e.noRetry:${exception.noRetry}, e.solutionId:${exception.solutionId}`);
            Logger.log("unjudgedSubmissionCollector exception: ", exception);
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
