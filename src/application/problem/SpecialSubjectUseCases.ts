import { specialSubjectRepository } from "../ports/SpecialSubjectRepository";

/** 专题。 */
export class SpecialSubjectUseCases {
	async listActive() {
		return await specialSubjectRepository.findActive();
	}
}

export default new SpecialSubjectUseCases();
