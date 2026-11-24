import { submissionQueryRepository } from "../ports/SubmissionQueryRepository";

export = async function (contest_id: any) {
	return await submissionQueryRepository.findContestSim(contest_id);
};
