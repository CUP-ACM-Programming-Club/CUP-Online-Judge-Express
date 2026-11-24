import { submissionQueryRepository } from "../ports/SubmissionQueryRepository";

class MaintainService {
    async getMaintainInfo(limit = false) {
        return await submissionQueryRepository.findMaintainInfo(limit);
    }
}

export default new MaintainService();
