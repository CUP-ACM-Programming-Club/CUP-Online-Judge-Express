import { definePort } from "./registry";

export interface AwardInput {
	userId: string;
	award: string;
	year: number;
}

/** 获奖记录的持久化。实现：infrastructure/persistence/award/MySqlAwardRepository */
export interface AwardRepository {
	add(award: AwardInput): Promise<unknown>;
	update(awardId: number, award: AwardInput): Promise<unknown>;
	remove(awardId: number): Promise<unknown>;
	findById(awardId: number): Promise<any[]>;
}

export const awardRepository = definePort<AwardRepository>("AwardRepository");
