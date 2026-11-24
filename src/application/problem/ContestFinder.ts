import { contestProblem as ContestProblem } from "../../infrastructure/orm/ts-model";

class ContestFinder {
	async find (problemId: number) {
		return ContestProblem.findAll({
			// 直接使用列名 problem_id（模型属性名为 problemId）；sequelize 会原样作为列名，v6 类型需显式放宽
			where: {
				problem_id: problemId
			} as any
		});
	}
}

export default new ContestFinder();
