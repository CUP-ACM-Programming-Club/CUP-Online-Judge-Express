import { definePort } from "./registry";

export interface ContestCheatRecord {
	user_id: string;
	solution_id: number | string;
	contest: number | string;
	num: number | string;
}

/** 比赛作弊记录（contest_cheat）。实现：infrastructure/persistence/contest/MySqlContestCheatRepository */
export interface ContestCheatRepository {
	insertCheat(record: ContestCheatRecord): Promise<unknown>;
	markChecked(solutionId: number | string): Promise<unknown>;
	findCheats(userId: string, contestId: number | string): Promise<any[]>;
}

export const contestCheatRepository = definePort<ContestCheatRepository>("ContestCheatRepository");
