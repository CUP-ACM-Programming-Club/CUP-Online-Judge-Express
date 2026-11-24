import * as fs from "fs";
import * as path from "path";
import { SRC_ROOT, layerOf, isAllowedEdge } from "./layers";

const IMPORT_RE = /(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*|\brequire\.resolve\s*\(\s*)["'](\.{1,2}(?:\/[^"']*)?)["']/g;

function walk(dir: string, out: string[]) {
	for (const name of fs.readdirSync(dir)) {
		const p = path.join(dir, name);
		const st = fs.statSync(p);
		if (st.isDirectory()) walk(p, out);
		else if (/\.(ts|js)$/.test(name)) out.push(p);
	}
	return out;
}

function resolveTarget(fromFile: string, spec: string): string | null {
	const base = path.resolve(path.dirname(fromFile), spec);
	for (const suf of ["", ".ts", ".d.ts", ".js", ".json", "/index.ts", "/index.js"]) {
		const cand = base + suf;
		if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
	}
	return null;
}

/** 返回所有违反依赖规则的边，形如 "interfaces/http/routes/x.ts -> infrastructure/db/index.ts"。 */
export function findViolations(): string[] {
	const files = walk(SRC_ROOT, []).filter(f => layerOf(f) !== "test");
	const out = new Set<string>();
	for (const f of files) {
		const from = layerOf(f);
		if (!from) continue;
		// 去掉注释，避免把注释里的示例路径算进去
		const content = fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
		let m: RegExpExecArray | null;
		IMPORT_RE.lastIndex = 0;
		while ((m = IMPORT_RE.exec(content))) {
			const target = resolveTarget(f, m[1]);
			if (!target) continue;
			const to = layerOf(target);
			if (!to) continue;
			const toRel = path.relative(SRC_ROOT, target).replace(/\\/g, "/");
			if (!isAllowedEdge(from, to, toRel)) {
				out.add(`${path.relative(SRC_ROOT, f).replace(/\\/g, "/")} -> ${toRel}`);
			}
		}
	}
	return [...out].sort();
}

if (require.main === module) {
	const v = findViolations();
	if (process.argv.includes("--write-baseline")) {
		fs.writeFileSync(path.join(__dirname, "baseline.json"), JSON.stringify(v, null, 1) + "\n");
	}
	const byKind: Record<string, number> = {};
	for (const e of v) {
		const [a, b] = e.split(" -> ");
		const k = `${layerOf(path.join(SRC_ROOT, a))} -> ${layerOf(path.join(SRC_ROOT, b))}`;
		byKind[k] = (byKind[k] || 0) + 1;
	}
	console.log(JSON.stringify({ total: v.length, byKind }, null, 1));
}
