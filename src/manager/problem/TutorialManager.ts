import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";

const query = require("../../module/mysql_cache");

interface ITutorialListDAO {
    tutorial_id: number,
    title: string
}

export class TutorialManager {
    @ErrorHandlerFactory(ok.okMaker)
    @Cacheable(new CachePool(), 1, "minute")
    getTutorialListByUserId(userId: string): Promise<ITutorialListDAO[]> {
        return query(`select tutorial_id, title from tutorial where user_id = ?`, [userId]);
    }
}

export default new TutorialManager();
