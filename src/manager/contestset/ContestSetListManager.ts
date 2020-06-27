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

interface IContestSetList {
    contestSetId: number,
    contestId: number
}

class ContestSetListManager {
    async getContestSetListByContestSetId(contestSetId: number | string): Promise<IContestSetListDAO[]> {
        return await MySQLManager.execQuery(`
select clist.*, contest.title,contest.start_time,contest.end_time,contest.maker from 
(select * from contest_set_list where contestset_id = ?)clist left join
contest on 
contest.contest_id = clist.contest_id`, [contestSetId]);
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

    async deleteContestSetList(contestSetId: number) {
        await MySQLManager.execQuery(`delete from contest_set_list where contestset_id = ?`, [contestSetId]);
    }

    async addContestSetListByContestSetIdAndContestId(contestSetId: number, contestId: number) {
        return await MySQLManager.execQuery(`insert into contest_set_list
(contestset_id, contest_id)values(?,?)`, [contestSetId, contestId]);
    }

    async addContestSetListByContestSetIdAndContestIdMultiple(contestSetListArray: IContestSetList[]) {
        return await MySQLManager.execQuery(`insert into contest_set_list(contestset_id, contest_id) 
values${contestSetListArray.map(() => "(?,?)").join(",")}`, contestSetListArray.flatMap(Object.values));
    }

    async updateContestSetListByRequest(req: Request) {
        const contestSetId = req.body.contestSetId;
        const contestIdList = req.body.contestIdList as number[];
        await this.deleteContestSetList(contestSetId);
        await this.addContestSetListByContestSetIdAndContestIdMultiple(contestIdList.map(contestId => {
            return {
                contestSetId,
                contestId
            };
        }));
    }
}

export default new ContestSetListManager();
