/** 延迟加载实现：第一次调用时才 require，避免 import 时就读配置/连数据库。 */
export function lazy<T extends object>(load: () => T): T {
	let impl: T | undefined;
	const get = () => (impl = impl || load());
	return new Proxy({} as T, {
		get: (_t, prop) => {
			const value = (get() as any)[prop];
			return typeof value === "function" ? value.bind(get()) : value;
		},
		has: (_t, prop) => prop in get()
	});
}
