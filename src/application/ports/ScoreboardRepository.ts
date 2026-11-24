import { definePort } from "./registry";

/** 榜单数据访问。实现：infrastructure/persistence/contest/MySqlScoreboardRepository */
export interface ScoreboardRepository {
	findContestSubmissions(contestId: number, browserPrivilege: boolean): Promise<any[]>;
	findUsersByIds(userIds: string[]): Promise<any[]>;
	findSimBySolutionIds(solutionIds: number[]): Promise<any[]>;
	findContestUsers(contestId: number): Promise<any[]>;
	countContestProblems(contestId: number): Promise<any[]>;
	findContestHeader(contestId: number): Promise<any[]>;
	findLineBreakInfo(contestId: number): Promise<any[]>;
}

export const scoreboardRepository = definePort<ScoreboardRepository>("ScoreboardRepository");
