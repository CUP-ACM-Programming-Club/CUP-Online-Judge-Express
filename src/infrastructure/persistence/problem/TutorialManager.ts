import {ErrorHandlerFactory} from "../../../shared/decorators/ErrorHandler";
import {ok} from "../../../domain/constants/state";
import Cacheable from "../../../shared/cache/Cacheable";
import CachePool from "../../../shared/cache/CachePool";

const query = require("../../db/legacy/mysql_cache");

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
