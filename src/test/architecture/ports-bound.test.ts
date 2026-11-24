/**
 * 每个用 definePort 声明的端口都必须在 main/compose 里绑定实现，否则线上第一次调用就会抛错。
 */
import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import { isBound, portName } from "../../application/ports/registry";
import "../../main/compose";

const portsDir = path.resolve(__dirname, "..", "..", "application", "ports");

describe("端口都已在组装根绑定", function () {
	const unbound: string[] = [];
	const checked: string[] = [];
	for (const file of fs.readdirSync(portsDir)) {
		if (!/\.ts$/.test(file) || file === "registry.ts") continue;
		const mod = require(path.join(portsDir, file));
		for (const [name, value] of Object.entries(mod)) {
			if (typeof value !== "object" || value === null) continue;
			try { portName(value as object); } catch (e) { continue; } // 不是端口
			checked.push(`${file}:${name}`);
			if (!isBound(value as object)) unbound.push(`${file}:${name}`);
		}
	}
	it("没有未绑定的端口", function () {
		expect(checked.length, "应至少扫描到一个端口").to.be.greaterThan(0);
		expect(unbound).to.deep.equal([]);
	});
});
