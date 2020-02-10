import {MySQLManager} from "../mysql/MySQLManager";
import {Request} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {error, ok} from "../../module/constants/state";
import ContestSetManager from "./ContestSetManager";

interface IContestSetListDAO {
    contestset_id: number,
    contest_id: number,
    contest_set_record_id: number,
    title: string,
    start_time: string,
    end_time: string,
    maker: string
}

class ContestSetListManager {
    async getContestSetListByContestSetId(ContestSetId: number | string): Promise<IContestSetListDAO[]> {
        return await MySQLManager.execQuery(`select contest_set_list.*, contest.title,contest.start_time,contest.end_time,contest.maker from contest_set_list where contestset_id left join contest on contest.contest_id = contest_set_list.contest_id`)
    }

    async checkLimitToAccess(req: Request, contestSetId: string | number) {
        const result = await ContestSetManager.hasLimitToAccessContestSet(req, contestSetId);
        if (!result) {
            throw new Error(error.noprivilege.statement);
        }
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getContestSetListByRequest(req: Request) {
        const contestSetId = req.params.contestSetId;
        await this.checkLimitToAccess(req, contestSetId);
        return await this.getContestSetListByContestSetId(contestSetId);
    }
}

export default new ContestSetListManager();
