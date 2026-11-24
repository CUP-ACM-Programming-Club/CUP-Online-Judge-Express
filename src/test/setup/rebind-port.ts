/**
 * 测试辅助：在当前 Module._load 拦截生效时，重新加载某个端口实现模块并绑定到端口上。
 *
 * 不少老测试用「拦截 Module._load + 重新 require 被测模块」的方式把 mysql_cache / MySQLManager / redis
 * 换成 stub。SQL 搬进 infrastructure 的仓储实现之后，被测用例经端口调用仓储，仓储模块早已被缓存、
 * 持有的是 mock-external 里的假实现；用它在拦截期间重新加载仓储并绑定，stub 就仍然生效，断言不用改。
 *
 * 返回的函数恢复原绑定，并把这次加载的模块从 require.cache 删掉（避免后面的测试拿到带 stub 的模块）。
 */
import { bindPort, boundImpl } from "../../application/ports/registry";

export function rebindFresh<T extends object>(port: T, resolvedModulePath: string, make: (mod: any) => T): () => void {
	const previous = boundImpl(port);
	delete require.cache[resolvedModulePath];
	bindPort(port, make(require(resolvedModulePath)));
	return () => {
		delete require.cache[resolvedModulePath];
		if (previous) {
			bindPort(port, previous);
		}
	};
}

/** 临时绑定一个假实现，返回恢复函数 */
export function bindTemporarily<T extends object>(port: T, impl: T): () => void {
	const previous = boundImpl(port);
	bindPort(port, impl);
	return () => {
		if (previous) {
			bindPort(port, previous);
		}
	};
}
