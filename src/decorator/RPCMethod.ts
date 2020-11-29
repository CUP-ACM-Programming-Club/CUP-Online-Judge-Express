import axios, {AxiosRequestConfig} from "axios";
import {RPCClient} from "../integration/rpc/RPCClient";

const rpcConfig = global.config.rpc;

const rpcRequestSchema = `${rpcConfig.protocol || "http"}://${rpcConfig.host || "127.0.0.1"}:${rpcConfig.port || "5031"}`;

interface RPCRequest {
    className: string,
    methodName: string,
    arguments: any[]
}

interface RPCResponse {
    data: any,
    success: boolean,
    exception: string
}

export default function (config?: AxiosRequestConfig) {
    return function<T extends RPCClient> (target: T, propertyName: string, propertyDescriptor: PropertyDescriptor) {
        propertyDescriptor.value = async function (...args: any[]) {
            const self: T = this as unknown as any;
            const request: RPCRequest = {
                className: self.className,
                methodName: propertyName,
                arguments: args
            }
            const httpResponse = await axios.post(rpcRequestSchema, request);
            const response: RPCResponse = httpResponse.data;
            if (response.success) {
                return response.data;
            }
            else {
                throw new Error(response.exception);
            }
        }
    }
}
