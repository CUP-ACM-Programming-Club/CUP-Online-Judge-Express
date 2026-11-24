import { definePort } from "./registry";

export interface ContestRow {
	title: any;
	startTime: string;
	endTime: string;
	/** "0" 公开 / "1" 私有 */
	private: string;
	langmask: any;
	description: any;
	password: any;
	ipPolicy: any;
	cmodVisible: any;
	limitHostname: any;
	defunct: string;
	showAllRanklist: any;
	showSim: any;
}

/** 事务连接（mysql2 promise 连接），由用例控制 begin/commit/rollback/release。 */
export interface ContestTxConnection {
	beginTransaction(): Promise<unknown>;
	commit(): Promise<unknown>;
	rollback(): Promise<unknown>;
	release(): void;
	query(sql: string, params?: any[]): Promise<any>;
}

/** 后台比赛管理的数据访问。实现：infrastructure/persistence/contest/MySqlAdminContestRepository */
export interface AdminContestRepository {
	findContestPage(where: string, orderBy: string, offset: number, limit: number): Promise<any[]>;
	countContests(where: string, orderBy: string): Promise<any[]>;
	findContestDefunct(contestId: number): Promise<any[]>;
	updateContestDefunct(contestId: number, defunct: string): Promise<unknown>;
	/** 返回 insert 结果（含 insertId） */
	insertContest(row: ContestRow, maker: string): Promise<any>;
	openConnection(): Promise<ContestTxConnection>;
	updateContest(connection: ContestTxConnection, contestId: number, row: ContestRow): Promise<unknown>;
	findContestCompetitors(contestId: number | string): Promise<any[]>;
}

export const adminContestRepository = definePort<AdminContestRepository>("AdminContestRepository");
