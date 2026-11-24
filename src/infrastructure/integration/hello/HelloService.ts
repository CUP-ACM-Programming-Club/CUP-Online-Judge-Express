import {RPCClient} from "../rpc/RPCClient";
import RPCMethod from "../rpc/RPCMethod";
import { HelloRpc } from "../../../application/ports/HelloRpc";

class HelloService implements RPCClient, HelloRpc {
    className = "com.cupacm.oj.api.HelloService"
    @RPCMethod({timeout: 3000})
    async sayHello (name: string) {
        return "";
    }
}

export default new HelloService();
