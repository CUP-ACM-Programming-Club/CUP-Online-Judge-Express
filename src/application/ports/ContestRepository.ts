import { definePort } from "./registry";

/** 比赛列表的筛选条件（由用例从会话/查询参数推导，SQL 片段由仓储实现拼装）。 */
export interface ContestListCriteria {
	/** admin | contest_manager：可以看到 defunct 比赛 */
	canSeeHidden: boolean;
	isAdmin: boolean;
	/** 当前进程的 contest_mode */
	contestMode: boolean;
	/** 只看「我的比赛」时的比赛 id 列表；null 表示不过滤 */
	myContestIds: string[] | null;
	/** 标题搜索词（原样，未 trim）；null 表示不搜索 */
	search: string | null;
	/** 原始页码参数（未校验） */
	page: unknown;
}

/** 比赛数据访问。实现：infrastructure/persistence/contest/MySqlContestRepository */
export interface ContestRepository {
	listContests(criteria: ContestListCriteria): Promise<any[]>;
	countContests(criteria: ContestListCriteria): Promise<number>;
	/** 不带搜索条件的总数（/contest/total） */
	countAllMatching(criteria: ContestListCriteria): Promise<number>;
	findAllContests(): Promise<any[]>;

	findContestById(contestId: number): Promise<any[]>;
	findContestForPassword(contestId: number): Promise<any[]>;
	findContestGeneralDetail(contestId: number): Promise<any[]>;
	findContestProblems(contestId: number, vjudge: boolean): Promise<any[]>;
	findUserSubmissionSummary(userId: string, contestId: number): Promise<any[]>;
	findContestLimitHostname(contestId: number): Promise<any[]>;
	findContestStatistics(contestId: number): Promise<any[]>;
	countContestProblems(contestId: number): Promise<any[]>;
	findContestProblem(contestId: number, num: number): Promise<any[]>;
	/** 记录「已通过比赛密码」的权限（没有才插入） */
	grantContestPrivilege(userId: string, contestId: number): Promise<unknown>;

	/** ORM 模型实例（调用方用 .get() 取值） */
	findContestModel(contestId: number): Promise<any>;
	findContestProblemModelsByProblemId(problemId: number): Promise<any[]>;

	/** global_setting 中 label = 'contest' 的行 */
	findContestModeSetting(): Promise<any[]>;

	/** 把 userList 设为 newContestIdList 中各比赛的选手（先清空 contestIdList 中各比赛的选手） */
	updateContestCompetitor(contestIdList: (string | number)[], userList: string[], newContestIdList: (string | number)[]): Promise<void>;
}

export const contestRepository = definePort<ContestRepository>("ContestRepository");
