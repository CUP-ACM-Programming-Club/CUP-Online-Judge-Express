import { userQueryRepository } from "../ports/UserQueryRepository";

class UserService {
    /**
     * Get User Profile Data for Profile Page
     * @param user_id 
     */
    async getUserProfile(user_id: string) {
        const result = await userQueryRepository.getProfileRows(user_id);

        return {
            submission: result[0],
            privilege: result[1],
            award: result[2],
            information: result[3][0],
            acm_user: result[4][0],
            special_subject: result[5],
            rank: result[6][0].rnk,
            // const_variable handled in controller
            login_time: result[7],
            article_publish: result[8],
            submission_count: result[9],
            browser: result[11],
            os: result[10],
            sim_count: result[12][0].cnt || 0,
            sim_average_percentage: result[13][0].average || 0,
            sim_average_length: result[14][0].average || 0,
            total_sim_time: result[15][0].cnt || 0,
            vjudge_rank: result[16][0].rnk
        };
    }

    async getUserInfoByUserId(user_id: string) {
        return await userQueryRepository.getUserInfoByUserId(user_id);
    }

    async getUserIdBySolutionId(solution_id: string | number) {
        const result = await userQueryRepository.getUserIdBySolutionId(solution_id);
        return result.length > 0 ? result[0].user_id : null;
    }

    async getLoginLogStats(fields: string[] = ["time"]) {
        // Safe-guard against SQL injection by filtering allowed fields
        const allowedFields = ["time", "os_name", "os_version", "browser_name", "browser_version"];
        const filteredFields = fields.filter(f => allowedFields.includes(f));
        if (filteredFields.length === 0) {
            filteredFields.push("time");
        }
        return await userQueryRepository.getLoginLogStats(filteredFields);
    }

    async getUserByNick(nick: string) {
        return await userQueryRepository.getUserByNick(nick);
    }

    async getRecentRegisteredUsers() {
        return await userQueryRepository.getRecentRegisteredUsers();
    }

    async getRegisterTimeline() {
        return await userQueryRepository.getRegisterTimeline();
    }

    async getSubmitStat(...args: any[]) {
        let [submitStat, line_break] = await userQueryRepository.getSubmitStatRows(...args);
        let map: any = {};
        for (const i of submitStat) {
            map[i.solution_id] = i;
        }
        for (const i of line_break) {
            map[i.solution_id] = Object.assign(map[i.solution_id], i);
        }
        return map;
    }

    async getUserConfirmInfo(user_id: string) {
        return await userQueryRepository.getUserConfirmInfo(user_id);
    }
}

export default new UserService();
