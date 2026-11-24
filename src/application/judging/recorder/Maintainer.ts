import Lock from "../../../shared/decorators/Lock";
import SingleLock from "../../../shared/Lock";

import { judgeResultRepository } from "../../ports/JudgeResultRepository";

export class Maintainer {
    @Lock(new SingleLock())
    async maintainUserInfo(user_id: string) {
        await judgeResultRepository.updateUserSolved(user_id);
        await judgeResultRepository.updateUserSubmit(user_id);
    }
    @Lock(new SingleLock())
    async maintainProblem(problem_id: number | string) {
        await judgeResultRepository.updateProblemAccepted(problem_id);
        await judgeResultRepository.updateProblemSubmit(problem_id);
    }
}

export default new Maintainer();
