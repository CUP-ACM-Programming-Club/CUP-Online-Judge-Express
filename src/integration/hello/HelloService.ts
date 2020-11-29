import {RPCClient} from "../rpc/RPCClient";
import RPCMethod from "../../decorator/RPCMethod";

class HelloService implements RPCClient {
    className = "com.cupacm.oj.api.HelloService"
    @RPCMethod({timeout: 3000})
    async sayHello (name: string) {
        return "";
    }
}

export default new HelloService();
