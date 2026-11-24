import BanUserManager from "../contest/BanUserManager";
import { SubmissionBanUser } from "../../../application/ports/SubmissionBanUser";

/** 适配 contest 领域的 BanUserManager（infrastructure → infrastructure）。 */
export class SubmissionBanUserAdapter implements SubmissionBanUser {
	banUser(solutionPack: any) {
		return BanUserManager.banUser(solutionPack);
	}
}
