import { definePort } from "./registry";

export interface TutorialListItem {
	tutorial_id: number;
	title: string;
	problem_id: number;
}

/** 题解（tutorial 表）。实现：infrastructure/persistence/problem/MySqlTutorialRepository */
export interface TutorialRepository {
	/** tableName 为 "solution" 或 "tutorial" */
	findOwnerRows(tableName: string, id: any): Promise<any[]>;
	findSolutionResult(solutionId: number, local: boolean): Promise<any[]>;
	findSourceProblemId(tutorialId: any): Promise<any[]>;
	findTutorialList(source: string, problemId: string): Promise<any[]>;
	/** 不给 tutorialId 时按 id 倒序列出全部 */
	findTutorials(tutorialId?: string): Promise<any[]>;
	insertTutorial(source: string, problemId: string, userId: string, solutionId: string, content: string): Promise<any>;
	updateTutorial(content: string, solutionId: string, tutorialId: string): Promise<any>;
	/** 某用户写过的题解（带 1 分钟缓存） */
	findTutorialListByUserId(userId: string): Promise<TutorialListItem[]>;
}

export const tutorialRepository = definePort<TutorialRepository>("TutorialRepository");
