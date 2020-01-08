import Lock from "../../../decorator/Lock";
import SingleLock from "../../common/Lock";

const query = require("../../mysql_query");

export class Maintainer {
    @Lock(new SingleLock())
    async maintainUserInfo(user_id: string) {
        await query("UPDATE `users` SET `solved`=(SELECT count(DISTINCT `problem_id`) FROM `solution` WHERE `user_id`= ? AND `result`='4') WHERE `user_id`= ?", [user_id, user_id]);
        await query("UPDATE `users` SET `submit`=(SELECT count(*) FROM `solution` WHERE `user_id`= ? and problem_id>0) WHERE `user_id`= ?", [user_id, user_id]);
    }
    @Lock(new SingleLock())
    async maintainProblem(problem_id: number | string) {
        await query("UPDATE `problem` SET `accepted`=(SELECT count(*) FROM `solution` WHERE `problem_id`= ? AND `result`='4') WHERE `problem_id`= ?", [problem_id, problem_id]);
        await query("UPDATE `problem` SET `submit`=(SELECT count(*) FROM `solution` WHERE `problem_id`= ?) WHERE `problem_id`= ?", [problem_id, problem_id]);
    }
}

export default new Maintainer();
