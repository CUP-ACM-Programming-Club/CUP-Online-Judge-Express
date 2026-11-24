/**
 * 测试辅助：临时替换端口绑定，结束后恢复原实现。
 *
 * bindFresh 会重新 require 一份实现模块再绑定——用在「测试先装好 Module._load 拦截（mock 掉
 * mysql_cache / mysql_query 等），再验证真实仓储发出的 SQL」的场景：实现模块重新加载时
 * 会拿到被拦截的依赖。
 */
import path from "path";
import { bindPort, boundImpl } from "../../application/ports/registry";

const SRC_ROOT = path.resolve(__dirname, "..", "..");

export class PortHarness {
	private saved: [object, any][] = [];

	bind<T extends object>(port: T, impl: T) {
		this.saved.push([port, boundImpl(port)]);
		bindPort(port, impl);
	}

	/** modulePath 相对 src/；exportName 为类名（会 new 一个实例）或 "default"（直接用导出的实例） */
	bindFresh<T extends object>(port: T, modulePath: string, exportName: string) {
		const resolved = require.resolve(path.join(SRC_ROOT, modulePath));
		delete require.cache[resolved];
		const exported = require(resolved)[exportName];
		this.bind(port, exportName === "default" ? exported : new exported());
	}

	restore() {
		for (const [port, impl] of this.saved.reverse()) {
			if (impl) bindPort(port, impl);
		}
		this.saved = [];
	}
}
