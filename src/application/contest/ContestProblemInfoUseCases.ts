import { Viewer } from "../../domain/policy/Viewer";
import ContestService from "../services/ContestService";
import { contestProblemInfoLookup } from "../ports/ContestProblemInfoLookup";

/** 比赛内各题目的基本信息（/contest/problem_info）。 */
export class ContestProblemInfoUseCases {
	async getProblemInfoList(req: Viewer, contestId: number) {
		// 先走 ContestService.getContestProblemList：含比赛访问检查，并按比赛是否 vjudge 取题目列表
		const result = await ContestService.getContestProblemList(req, contestId);
		const contestProblemInfo = result.data;
		return (await Promise
			.all(contestProblemInfo
				.map((e: any) => contestProblemInfoLookup.findProblemInfo(e.pid))
			)
		).map((e: any) => {
			const ret = e.get();
			return {
				problem_id: ret.problem_id,
				title: ret.title,
				source: ret.source,
				label: ret.label,
				in_date: ret.in_date,
				accepted: ret.accepted,
				submit: ret.submit,
				solved: ret.solved
			};
		});
	}
}

export default new ContestProblemInfoUseCases();
