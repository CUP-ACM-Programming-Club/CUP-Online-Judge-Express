import { submissionUserRepository } from "../ports/SubmissionUserRepository";

export async function getUserInfoByUserId(user_id: string) {
	return await submissionUserRepository.findUserById(user_id);
}

export async function getUserIdBySolutionId(solution_id: string | number) {
	return (await submissionUserRepository.findSolutionUser(solution_id))[0].user_id;
}
