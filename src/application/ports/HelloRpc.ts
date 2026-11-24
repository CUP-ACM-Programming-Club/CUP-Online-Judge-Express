import { definePort } from "./registry";

/** 外部 SOA 服务的连通性示例（/soa-proxy/hello）。实现：infrastructure/integration/hello/HelloService */
export interface HelloRpc {
	sayHello(name: string): Promise<any>;
}

export const helloRpc = definePort<HelloRpc>("HelloRpc");
