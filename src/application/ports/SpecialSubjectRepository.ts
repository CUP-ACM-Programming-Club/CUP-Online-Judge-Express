import { definePort } from "./registry";

/** 专题列表。实现：infrastructure/persistence/problem/MySqlSpecialSubjectRepository */
export interface SpecialSubjectRepository {
	findActive(): Promise<any[]>;
}

export const specialSubjectRepository = definePort<SpecialSubjectRepository>("SpecialSubjectRepository");
