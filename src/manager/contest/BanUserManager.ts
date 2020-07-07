import Cheating from "../../module/contest/cheating_ban";
import SubmissionManager from "../submission/SubmissionManager";
const {ConfigManager} = require("../../module/config/config-manager");
export class BanUserManager {

    private async solutionContainContestId(solutionId: number) {
        const data: any = await SubmissionManager.getSolutionInfo(solutionId);
        return data && data.contest_id && !isNaN(parseInt(data.contest_id));
    }

    async banUser (solution_pack: any) {
        if (!ConfigManager.isSwitchedOn("ban_contest_cheater", 0)) {
            return;
        }
        solution_pack.sim = parseInt(solution_pack.sim);
        const sim = solution_pack.sim;
        if (sim >= ConfigManager.getConfig("ban_contest_sim_trigger", 100) && solution_pack.state === 4 &&
            (Object.prototype.hasOwnProperty.call(solution_pack, "contest_id") || await this.solutionContainContestId(solution_pack.solution_id))) {
            if (!Object.prototype.hasOwnProperty.call(solution_pack, "contest_id")) {
                Object.assign(solution_pack, await SubmissionManager.getSolutionInfo(solution_pack.solution_id));
            }
            Object.assign(solution_pack, {state: 15});
            const {contest_id, num, user_id, solution_id} = solution_pack;
            await Cheating.addCheating(user_id, contest_id, {solution_id, num});
        }
    }
}

export default new BanUserManager();
