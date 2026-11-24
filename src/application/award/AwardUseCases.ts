import { AwardInput, awardRepository } from "../ports/AwardRepository";

function assertAward(raw: any): asserts raw is AwardInput {
	if (typeof raw === "undefined" || raw === null) {
		throw new Error("request body should not be null or undefined");
	}
	if (typeof raw.userId !== "string") {
		throw new Error("user id should be string");
	}
	if (typeof raw.award !== "string") {
		throw new Error("award should be string");
	}
	if (typeof raw.year !== "number") {
		throw new Error("year should be number");
	}
}

function parseAwardId(raw: any): number {
	if (isNaN(raw)) {
		throw new Error("award id should be number");
	}
	return parseInt(raw);
}

/** 获奖记录用例：校验输入，再交给仓储。 */
export class AwardUseCases {
	async add(raw: any) {
		assertAward(raw);
		await awardRepository.add(raw);
	}

	async update(rawAwardId: any, raw: any) {
		const awardId = parseAwardId(rawAwardId);
		assertAward(raw);
		await awardRepository.update(awardId, raw);
	}

	async remove(rawAwardId: any) {
		await awardRepository.remove(parseAwardId(rawAwardId));
	}

	async get(rawAwardId: any) {
		return await awardRepository.findById(parseAwardId(rawAwardId));
	}
}

export default new AwardUseCases();
