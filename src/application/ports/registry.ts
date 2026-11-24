/**
 * 端口注册表：application 层通过 definePort 声明「我需要什么能力」，
 * 具体实现（MySQL、Redis、log4js……）由 main/compose.ts 在启动时 bindPort 进来。
 * application 因此只依赖接口，不依赖任何 infrastructure 模块。
 *
 *   // application/ports/SolutionRepository.ts
 *   export interface SolutionRepository { findById(id: number): Promise<Solution | null> }
 *   export const solutionRepository = definePort<SolutionRepository>("SolutionRepository");
 *
 *   // main/compose.ts
 *   bindPort(solutionRepository, new MySqlSolutionRepository());
 *
 * 端口对象是一个代理：调用 solutionRepository.findById(...) 时才去找已绑定的实现，
 * 所以模块加载顺序无关，测试里也可以随时 bindPort 换成假实现。
 */

const PORT_NAME = Symbol("portName");
const bindings = new Map<string, any>();

export function definePort<T extends object>(name: string): T {
	const target = { [PORT_NAME]: name } as any;
	return new Proxy(target, {
		get(_t, prop) {
			if (prop === PORT_NAME) return name;
			const impl = bindings.get(name);
			if (impl === undefined) {
				throw new Error(`端口 ${name} 还没有绑定实现（应在 main/compose.ts 里 bindPort）`);
			}
			const value = impl[prop];
			return typeof value === "function" ? value.bind(impl) : value;
		},
		has(_t, prop) {
			const impl = bindings.get(name);
			return impl !== undefined && prop in impl;
		}
	}) as T;
}

export function portName(port: object): string {
	const name = (port as any)[PORT_NAME];
	if (typeof name !== "string") throw new Error("不是用 definePort 声明的端口");
	return name;
}

export function bindPort<T extends object>(port: T, impl: T): void {
	bindings.set(portName(port), impl);
}

export function isBound(port: object): boolean {
	return bindings.has(portName(port));
}

/** 取出端口当前绑定的原始实现（测试里用来恢复）。 */
export function boundImpl<T extends object>(port: T): T | undefined {
	return bindings.get(portName(port));
}
