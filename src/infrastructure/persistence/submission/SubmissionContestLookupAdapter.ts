import ContestManager from "../contest/ContestManager";
import { SubmissionContestLookup } from "../../../application/ports/SubmissionSubmitRepository";

/** 适配 contest 领域的 ContestManager（infrastructure → infrastructure）。 */
export class SubmissionContestLookupAdapter implements SubmissionContestLookup {
    isContestSubmittable(contestId: number, userId: string) {
        return ContestManager.isContestSubmittable(contestId, userId);
    }
}
