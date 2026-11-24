import { definePort } from "./registry";

export interface ContestSetDTO {
	contestSetId?: number;
	title: string;
	creator?: string;
	description: string;
	visible: boolean;
	defunct: string;
}

export interface ContestSetDAO extends ContestSetDTO {
	contestset_id: number;
	create_time: string;
}

export interface ContestSetListDAO {
	contestset_id: number;
	contest_id: number;
	contest_set_record_id: number;
	title: string;
	start_time: string;
	end_time: string;
	maker: string;
}

export interface ContestSetListItem {
	contestSetId: number;
	contestId: number;
}

/** 比赛集（专题）数据访问。实现：infrastructure/persistence/contestset/MySqlContestSetRepository */
export interface ContestSetRepository {
	/** 分页列表；非管理员只看 defunct = 'N' and visible = 1 */
	findContestSets(isAdmin: boolean, page: number): Promise<any[]>;
	addContestSet(payload: ContestSetDTO): Promise<any>;
	updateContestSet(payload: ContestSetDTO): Promise<unknown>;
	findContestSetById(contestSetId: number | string): Promise<ContestSetDAO | null>;
	findTopicAssistants(contestSetId: number | string): Promise<any[] | null>;
	/** 比赛集内所有比赛的选手（去重） */
	findAllCompetitors(contestSetId: number | string): Promise<string[]>;
	findContestSetList(contestSetId: number | string): Promise<ContestSetListDAO[]>;
	findContestIdList(contestSetId: number | string): Promise<number[]>;
	deleteContestSetList(contestSetId: number): Promise<void>;
	addContestSetListMultiple(list: ContestSetListItem[]): Promise<unknown>;
}

export const contestSetRepository = definePort<ContestSetRepository>("ContestSetRepository");
