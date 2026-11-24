/**
 * 用例层测试示范：给端口绑定内存假实现，不碰数据库，也不需要 mock 模块加载。
 */
import { expect } from "chai";
import { bindPort, boundImpl } from "../../application/ports/registry";
import { awardRepository, AwardInput, AwardRepository } from "../../application/ports/AwardRepository";
import AwardController from "../../interfaces/http/controllers/AwardController";

class InMemoryAwardRepository implements AwardRepository {
	rows = new Map<number, AwardInput>();
	nextId = 1;
	async add(a: AwardInput) { this.rows.set(this.nextId++, a); }
	async update(id: number, a: AwardInput) { this.rows.set(id, a); }
	async remove(id: number) { this.rows.delete(id); }
	async findById(id: number) { const r = this.rows.get(id); return r ? [Object.assign({ award_id: id }, r)] : []; }
}

describe("AwardUseCases（经 AwardController）", function () {
	let previous: AwardRepository | undefined;
	let repo: InMemoryAwardRepository;
	beforeEach(() => { previous = boundImpl(awardRepository); repo = new InMemoryAwardRepository(); bindPort(awardRepository, repo); });
	afterEach(() => { if (previous) bindPort(awardRepository, previous); });

	it("新增、修改、查询、删除", async () => {
		expect(await AwardController.add({ body: { userId: "u1", award: "金牌", year: 2026 } } as any)).to.deep.equal({ status: "OK", data: undefined });
		await AwardController.update({ params: { award_id: "1" }, body: { userId: "u1", award: "银牌", year: 2026 } } as any);
		const got: any = await AwardController.get({ params: { award_id: "1" } } as any);
		expect(got.data[0].award).to.equal("银牌");
		await AwardController.remove({ params: { award_id: "1" } } as any);
		expect(repo.rows.size).to.equal(0);
	});

	it("输入不合法时返回 error，与重构前的报错文案一致", async () => {
		expect(await AwardController.add({ body: { userId: 1 } } as any)).to.deep.equal({ status: "error", statement: "user id should be string" });
		expect(await AwardController.get({ params: { award_id: "x" } } as any)).to.deep.equal({ status: "error", statement: "award id should be number" });
		expect(await AwardController.add({ body: null } as any)).to.deep.equal({ status: "error", statement: "request body should not be null or undefined" });
	});
});
