import { error } from "../../domain/constants/state";
import { ContestSetDTO, contestSetRepository } from "../ports/ContestSetRepository";
import { contestRepository } from "../ports/ContestRepository";
import ContestAssistantUseCases from "../contest/ContestAssistantUseCases";

class ContestSetPayloadValidator {

    formatDefunct(defunct: any) {
        if (typeof defunct === "string") {
            if (defunct === "Y" || defunct === "N") {
                return defunct;
            }
            else {
                return "N";
            }
        }
        else {
            return !!defunct ? "Y" : "N";
        }
    }

    contestSetIdValidate(contestSetId: any) {
        contestSetId = parseInt(contestSetId);
        if (isNaN(contestSetId)) {
            throw new Error("Contest Set ID must be number");
        }
        else {
            return contestSetId;
        }
    }

    validate(payload: any) {
        const contestPayload = payload as ContestSetDTO;
        contestPayload.defunct = this.formatDefunct(contestPayload.defunct);
        return contestPayload;
    }
}

/**
 * 比赛集（专题）用例。body 等参数与原实现一样会被原地补充字段（creator / defunct / contestSetId）。
 */
export class ContestSetUseCases {
    validator = new ContestSetPayloadValidator();

    async listContestSets(rawPage: any, isAdmin: boolean) {
        const page = isNaN(parseInt(rawPage as string)) ? 0 : parseInt(rawPage as string);
        return await contestSetRepository.findContestSets(isAdmin, page);
    }

    /** 新建比赛集并写入比赛列表；新 id 回写到 body.contestSetId */
    async addContestSet(body: any, userId: string) {
        body.creator = userId;
        const payload = this.validator.validate(body);
        const response = await contestSetRepository.addContestSet(payload);
        body.contestSetId = response.insertId as number;
        await this.updateContestSetList(body);
    }

    async updateContestSet(body: any) {
        const payload = this.validator.validate(body);
        await contestSetRepository.updateContestSet(payload);
        await this.updateContestSetList(body);
        await ContestAssistantUseCases.updateTopicAssistantList(body.contestSetId, body.topicAssistant as string[]);
        if (body.userList === undefined || body.userList === null) {
            return;
        }
        const contestIdList = await contestSetRepository.findContestIdList(body.contestSetId);
        await contestRepository.updateContestCompetitor(contestIdList || [], body.userList || [], body.contestIdList || []);
    }

    private async updateContestSetList(body: any) {
        const contestSetId = body.contestSetId;
        const contestIdList = body.contestIdList as number[];
        await contestSetRepository.deleteContestSetList(contestSetId);
        await contestSetRepository.addContestSetListMultiple(contestIdList.map(contestId => {
            return {
                contestSetId,
                contestId
            };
        }));
    }

    async getContestSet(rawContestSetId: any) {
        const contestSetId = this.validator.contestSetIdValidate(rawContestSetId);
        return await contestSetRepository.findContestSetById(contestSetId);
    }

    /** 比赛集信息 + 专题助教（assistant）+ 所有比赛的选手（userList） */
    async getContestSetForAdministrator(rawContestSetId: any) {
        const contestSetId = this.validator.contestSetIdValidate(rawContestSetId);
        const [contestSetInfo, topicAssistantInfoList, userList] = await Promise.all([contestSetRepository.findContestSetById(contestSetId), contestSetRepository.findTopicAssistants(contestSetId), contestSetRepository.findAllCompetitors(contestSetId)]) ;
        return Object.assign(contestSetInfo as any, {assistant: topicAssistantInfoList}, {userList});
    }

    /** 非管理员只能看 defunct = 'N' 的比赛集（不看 visible） */
    async hasLimitToAccessContestSet(isAdmin: boolean, contestSetId: string | number) {
        if (isAdmin) {
            return true;
        }
        else {
            const response = await contestSetRepository.findContestSetById(contestSetId);
            return response!.defunct === "N";
        }
    }

    async getContestSetList(contestSetId: any, isAdmin: boolean) {
        const result = await this.hasLimitToAccessContestSet(isAdmin, contestSetId);
        if (!result) {
            throw new Error(error.noprivilege.statement);
        }
        return await contestSetRepository.findContestSetList(contestSetId);
    }
}

export default new ContestSetUseCases();
