import { definePort } from "./registry";

/** 提交统计图表数据（带 Redis 缓存）。实现：infrastructure/persistence/submission/graph_data_optimizer。 */
export interface SubmissionGraphData {
	getGraphDataWithCache(contestId: number, granularity: string): Promise<any[]>;
	clearGraphDataCache(contestId: number): Promise<void>;
}

export const submissionGraphData = definePort<SubmissionGraphData>("SubmissionGraphData");
