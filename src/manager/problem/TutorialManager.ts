import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";

const query = require("../../module/mysql_cache");

interface ITutorialListDAO {
    tutorial_id: number,
    title: string,
    problem_id: number
}

export class TutorialManager {
    @ErrorHandlerFactory(ok.okMaker)
    @Cacheable(new CachePool(), 1, "minute")
    getTutorialListByUserId(userId: string): Promise<ITutorialListDAO[]> {
        return query(`select tutorial_id, tutorial.problem_id as problem_id, problem.title as title from tutorial left join problem on problem.problem_id = tutorial.problem_id where user_id = ?`, [userId]);
    }
}

export default new TutorialManager();
