import { SubmissionJudger } from "../ports/SubmissionJudger";
import { judgeQueueRepository } from "../ports/JudgeQueueRepository";
import { ConfigManager } from "../ports/Config";
import dayjs from "dayjs";
import Logger from "../../shared/Logger";
import { wait } from "../../shared/decorators/RetryAsync";
const DEFAULT_LOOP_SECONDS = 3000;
const SUBMISSION_COLLECT_LIMIT = 30;
// 与 localJudger 的领取租约一致：排队超过这么久没判完就重新领取
const CLAIM_LEASE_SECONDS = 300;

class UnjudgedSubmissionCollector {
    private judger?: SubmissionJudger;
    private interval?: NodeJS.Timeout;
    private collectFinished?: boolean;
    private noDataProblemIdSet = new Set();

    setJudger(judger: SubmissionJudger) {
        this.judger = judger;
        return this;
    }

    addNewNoDataProblemId(problemId: number | string) {
        this.noDataProblemIdSet.add(`${problemId}`);
    }

    start() {
        this.noDataProblemIdSet.add("0");
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

    async collectHandler() {
        try {
            this.collectFinished = false;
            const noDataProblemIdList = Array.from(this.noDataProblemIdSet);
            const waitingResult = await judgeQueueRepository.findWaitingSubmissions(noDataProblemIdList, ConfigManager.getConfig("submission_collect_limit", SUBMISSION_COLLECT_LIMIT));
            const rejudgeResult = await judgeQueueRepository.findRejudgeSubmissions(noDataProblemIdList, ConfigManager.getConfig("submission_collect_limit", SUBMISSION_COLLECT_LIMIT));
            // 领取后迟迟没判完的提交（领取方可能已崩溃），租约过期后由收集器重新领取
            const staleResult = await judgeQueueRepository.findStaleClaimedSubmissions(noDataProblemIdList, ConfigManager.getConfig("judge_claim_lease_seconds", CLAIM_LEASE_SECONDS), ConfigManager.getConfig("submission_collect_limit", SUBMISSION_COLLECT_LIMIT));
            const result = [...waitingResult, ...rejudgeResult, ...staleResult];
            await wait(2000);
            for (let i in result) {
                if (!Object.prototype.hasOwnProperty.call(result, i)) {
                    continue;
                }
                const solutionId = parseInt(result[i].solution_id);
                try {
                    const _data = await judgeQueueRepository.countAdministrator(result[i].user_id);
                    const admin = !!(_data && _data.length && _data[0].cnt);
                    const priority = parseInt(String(!!result[i].result));
                    console.log(`Current Time: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}, solutionId: ${solutionId}`);
                    // Add timeout to prevent hanging indefinitely
                    // Default 5 minutes timeout (300000 ms)
                    const timeoutMs = ConfigManager.getConfig("judger_request_timeout", 300000);
                    await Promise.race([
                        this.judger!.addTask(solutionId, admin, false, (priority + 1) % 2),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Judger task timeout")), timeoutMs))
                    ]);
                } catch (e) {
                    console.error("Collector task error:", e);
                    await judgeQueueRepository.markSubmitFailed(solutionId);
                }
            }
        }
        catch (e) {
            const exception = e as unknown as any;
            if (exception && exception.noRetry && exception.solutionId) {
                Logger.log(`e, e.noRetry, e.solutionId: ${exception.solutionId}`);
                await judgeQueueRepository.markSubmitFailed(exception.solutionId);
            }
            Logger.log(`e:${exception}, e.noRetry:${exception.noRetry}, e.solutionId:${exception.solutionId}`);
            Logger.log("unjudgedSubmissionCollector exception: ", exception);
        }
        this.collectFinished = true;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            return true;
        }
        return false;
    }

    newInstance() {
        return new UnjudgedSubmissionCollector();
    }
}

export default new UnjudgedSubmissionCollector();
