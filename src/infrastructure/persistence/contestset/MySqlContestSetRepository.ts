import { ContestSetDTO, ContestSetListItem, ContestSetRepository } from "../../../application/ports/ContestSetRepository";
import ContestSetManager from "./ContestSetManager";
import ContestSetListManager from "./ContestSetListManager";

/** 比赛集端口的实现：SQL 在 ContestSetManager / ContestSetListManager 里。 */
export class MySqlContestSetRepository implements ContestSetRepository {
    findContestSets(isAdmin: boolean, page: number) {
        return ContestSetManager.getContestSetByConditional(ContestSetManager.buildAdminSQL(isAdmin), page);
    }

    addContestSet(payload: ContestSetDTO) {
        return ContestSetManager.addContestSetByDTO(payload);
    }

    updateContestSet(payload: ContestSetDTO) {
        return ContestSetManager.updateContestSetByDTO(payload);
    }

    findContestSetById(contestSetId: number | string) {
        return ContestSetManager.getContestSetByContestSetId(contestSetId);
    }

    findTopicAssistants(contestSetId: number | string) {
        return ContestSetManager.getTopicAssistantByContestSetId(contestSetId);
    }

    findAllCompetitors(contestSetId: number | string) {
        return ContestSetManager.getAllCompetitorByContestSetId(contestSetId);
    }

    findContestSetList(contestSetId: number | string) {
        return ContestSetListManager.getContestSetListByContestSetId(contestSetId);
    }

    findContestIdList(contestSetId: number | string) {
        return ContestSetListManager.getContestListByContestSetId(contestSetId);
    }

    deleteContestSetList(contestSetId: number) {
        return ContestSetListManager.deleteContestSetList(contestSetId);
    }

    addContestSetListMultiple(list: ContestSetListItem[]) {
        return ContestSetListManager.addContestSetListByContestSetIdAndContestIdMultiple(list);
    }
}

export default new MySqlContestSetRepository();
