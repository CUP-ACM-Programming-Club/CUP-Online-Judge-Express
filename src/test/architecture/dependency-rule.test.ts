/**
 * 依赖规则守门：新代码不允许出现新的跨层违规；已修掉的违规必须同时从 baseline 删除（只减不增）。
 * 更新 baseline：TS_NODE_TRANSPILE_ONLY=1 node -r ts-node/register src/test/architecture/scan.ts --write-baseline
 */
import { expect } from "chai";
import { findViolations } from "./scan";
const baseline: string[] = require("./baseline.json");

describe("Clean Architecture 依赖规则", function () {
	const current = findViolations();

	it("没有新增的跨层依赖", function () {
		const added = current.filter(v => !baseline.includes(v));
		expect(added, "新增违规（依赖方向错了：domain ← application ← interfaces/infrastructure）").to.deep.equal([]);
	});

	it("baseline 里没有已经修掉的条目（只减不增）", function () {
		const fixed = baseline.filter(v => !current.includes(v));
		expect(fixed, "这些违规已经不存在，请从 baseline.json 删除").to.deep.equal([]);
	});
});
