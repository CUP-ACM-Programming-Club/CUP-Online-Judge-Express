import { definePort } from "./registry";

/** application/util 里历史遗留的几个写库辅助函数。实现：infrastructure/persistence/user/MySqlLegacyUtilRepository */
export interface LegacyUtilRepository {
	removeAllContestProblem(contestId: number | string): Promise<void>;
	removeAllContestProblemWithTransaction(connection: any, contestId: number | string): Promise<void>;
	removeAllCompetitorPrivilege(contestId: number | string): Promise<void>;
	removeAllCompetitorPrivilegeWithTransaction(connection: any, contestId: number | string): Promise<void>;
	addContestProblem(contestId: number | string, problemList: any[]): Promise<void>;
	addContestProblemWithTransaction(connection: any, contestId: number | string, problemList: any[]): Promise<void>;
	addContestCompetitor(contestId: number | string, userList: any[]): Promise<void>;
	addContestCompetitorWithTransaction(connection: any, contestId: number | string, userList: any[]): Promise<void>;
	startupInit(): Promise<any>;
}

export const legacyUtilRepository = definePort<LegacyUtilRepository>("LegacyUtilRepository");
