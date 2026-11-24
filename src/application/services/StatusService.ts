import { JudgeResult } from "../../domain/enums/JudgeResult";
import { getGraphLabel, TIME_GRANULARITY } from "../../domain/constants/graph_granularity";
import { redactRows, SUBMISSION_SENSITIVE_FIELDS } from "../../domain/policy/privacy";
import { canBrowseSource, canSeeContestSensitive, isContestAssistant } from "../../domain/policy/predicates";
import { StatusQueryOptions, submissionStatusRepository } from "../ports/SubmissionStatusRepository";
import { submissionGraphData } from "../ports/SubmissionGraphData";

const const_name = require("../../domain/constants/const_name");

export class StatusService {

    private check_owner(data: any, owner: boolean) {
        return owner ? data : "----";
    }

    private renameProperty(element: any, newProperty: string, oldProperty: string) {
        element[newProperty] = element[oldProperty];
        delete element[oldProperty];
    }

    /**
     * 为一页提交批量取用户信息：user_id -> 与原逐行查询 `WHERE user_id = ?` 完全相同的结果数组。
     *
     * 一次 IN 查询取回本页全部用户；IN 结果按 user_id 精确匹配（users.user_id 是主键，精确相等的那一行
     * 必然就是原 `= ?` 查询返回的唯一一行）。精确匹配不上的（users 中不存在，或只在排序规则意义下相等，
     * 如大小写/尾随空格不同）退回原逐行查询，保证结果逐字节一致。
     */
    private async loadUserInfo(rows: any[]): Promise<Map<any, any[]>> {
        const userIds = [...new Set(rows.map((row: any) => row.user_id))];
        const infoById = new Map<any, any[]>();
        if (userIds.length === 0) {
            return infoById;
        }
        const users = await submissionStatusRepository.findUsersByIds(userIds);
        for (const user of users) {
            if (userIds.includes(user.user_id) && !infoById.has(user.user_id)) {
                infoById.set(user.user_id, [{ nick: user.nick, avatar: user.avatar, avatarUrl: user.avatarUrl, email: user.email }]);
            }
        }
        const unmatched = userIds.filter(id => !infoById.has(id));
        const fallback = await Promise.all(unmatched.map(id => submissionStatusRepository.findUserInfo(id)));
        unmatched.forEach((id, i) => infoById.set(id, fallback[i]));
        return infoById;
    }

    private buildResponse(req: any, val: any, _user_info: any[], request_query: any, browser_privilege: boolean, _end: boolean) {
        if (_user_info.length > 0) {
            const nick = _user_info[0].nick.trim();
            const avatar = Boolean(_user_info[0].avatar);
            const avatarUrl = _user_info[0].avatarUrl || "";
            const email = _user_info[0].email || "";
            let element = Object.assign({ nick, avatar, avatarUrl, email }, val);
            this.renameProperty(element, "sim_id", "sim_s_id");
            this.renameProperty(element, "length", "code_length");

            if ((request_query.contest_id && browser_privilege) || !request_query.contest_id || _end) {
                return element;
            } else {
                const owner = req.session.user_id === val.user_id;
                return Object.assign(element, {
                    memory: this.check_owner(val.memory, owner),
                    time: this.check_owner(val.time, owner),
                    length: this.check_owner(val.code_length, owner)
                });
            }
        }
        return val; // Fallback if user info missing, though unlikely
    }

    public async getStatusList(req: any, request_query: StatusQueryOptions) {
        const limit = request_query.limit || 0;

        let _end: any = false;
        // 原样保留取值：非特权且无 contest_id 时为 undefined（响应里 browse_code 键缺失）
        const browser_privilege: any = canBrowseSource(req) ||
            (request_query.contest_id && await isContestAssistant(request_query.contest_id, req.session.user_id));

        // 筛选条件（含 sim）到 SQL 的转换在仓储实现里，三种口径的字段、排序与原实现一致
        let _res;
        if (browser_privilege) {
            _res = await submissionStatusRepository.findStatusPage("privileged", request_query, limit);
        } else if (request_query.contest_id) {
            const end_cnt = await submissionStatusRepository.findContestEnded(request_query.contest_id);
            _end = end_cnt[0].cnt;
            _res = await submissionStatusRepository.findStatusPage("contest", request_query, limit);
        } else {
            _res = await submissionStatusRepository.findStatusPage("global", request_query, limit);
        }

        const userInfo = await this.loadUserInfo(_res);
        let result = _res.map((e: any) => this.buildResponse(req, e, userInfo.get(e.user_id)!, request_query, browser_privilege, Boolean(_end)));

        // ip / fingerprint / fingerprintRaw / email 仅对特权用户及本人可见；email 另提供 email_hash 供 gravatar 使用
        const sensitivePrivileged = Boolean(browser_privilege) ||
            (!!request_query.contest_id && canSeeContestSensitive(req, request_query.contest_id));
        result = redactRows(result, {
            privileged: sensitivePrivileged,
            viewerId: req.session && req.session.user_id,
            fields: SUBMISSION_SENSITIVE_FIELDS,
            hashEmail: true
        });

        return {
            result: result,
            const_list: const_name,
            self: req.session.user_id,
            isadmin: req.session.isadmin,
            browse_code: browser_privilege,
            end: Boolean(_end)
        };
    }

    /** 清除比赛的图表缓存（原 routes/status 导出的 clearGraphCache） */
    public async clearGraphDataCache(contestId: number) {
        return await submissionGraphData.clearGraphDataCache(contestId);
    }

    public async getGraphData(contestId?: number) {
        const SECONDS = 1000;
        const MINUTES = 60 * SECONDS;
        const HOURS = 60 * MINUTES;
        const DAYS = 24 * HOURS;
        const WEEKS = 7 * DAYS;
        const MONTH = 30 * DAYS;
        const YEARS = 365 * DAYS;

        const calculateDiffTimeMilliseconds = (diff_time: any) => {
            return diff_time.years * YEARS
                + diff_time.months * MONTH
                + diff_time.weeks * WEEKS
                + diff_time.days * DAYS
                + diff_time.minutes * MINUTES
                + diff_time.seconds * SECONDS
                + diff_time.milliseconds;
        };

        if (contestId) {
            const result = await submissionStatusRepository.findContest(contestId);
            if (result.length) {
                const start_time = new Date(result[0].start_time), end_time = new Date(result[0].end_time);
                // @ts-ignore
                const timediff = require("timediff");
                const diffMilliseconds = calculateDiffTimeMilliseconds(timediff(start_time, new Date(Math.min(new Date().getTime(), end_time.getTime()))));

                let granularity = TIME_GRANULARITY.MONTH;
                if (diffMilliseconds > 10 * MONTH) {
                    granularity = TIME_GRANULARITY.MONTH;
                } else if (diffMilliseconds > 12 * DAYS) {
                    granularity = TIME_GRANULARITY.DAY;
                } else if (diffMilliseconds > 12 * HOURS) {
                    granularity = TIME_GRANULARITY.HOUR;
                } else if (diffMilliseconds > 12 * MINUTES) {
                    granularity = TIME_GRANULARITY.MINUTE;
                } else {
                    granularity = TIME_GRANULARITY.SECOND;
                }

                const data = await submissionGraphData.getGraphDataWithCache(contestId, granularity);
                return {
                    result: data,
                    label: getGraphLabel(granularity)
                };
            }
        }

        // Global stats
        const data = await submissionGraphData.getGraphDataWithCache(0, TIME_GRANULARITY.MONTH);
        return {
            result: data,
            label: getGraphLabel(TIME_GRANULARITY.MONTH)
        };
    }
}

export default new StatusService();
