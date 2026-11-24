import {MySQLManager} from "../../db/mysql/MySQLManager";
import { ContestSetListDAO as IContestSetListDAO, ContestSetListItem as IContestSetList } from "../../../application/ports/ContestSetRepository";

/** 比赛集与比赛的关联（contest_set_list）的数据访问。 */
class ContestSetListManager {
    async getContestSetListByContestSetId(contestSetId: number | string): Promise<IContestSetListDAO[]> {
        return await MySQLManager.execQuery(`
select clist.*, contest.title,contest.start_time,contest.end_time,contest.maker from 
(select * from contest_set_list where contestset_id = ?)clist left join
contest on 
contest.contest_id = clist.contest_id`, [contestSetId]);
    }

    async getContestListByContestSetId (contestSetId: string | number) {
        const response = await this.getContestSetListByContestSetId(contestSetId) || [];
        return response.map(e => e.contest_id);
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
}

export default new ContestSetListManager();
