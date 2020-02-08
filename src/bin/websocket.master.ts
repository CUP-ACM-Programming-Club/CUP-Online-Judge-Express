import cluster from "cluster";
import net from "net";

async function main() {
    if (cluster.isMaster) {
        require("../module/init/preinstall")();
        require("../module/init/build_env")();
        require("../module/config/transfer/ClusterTransfer").default();
        require("../module/config/cluster/websocket-reload");
    }
    else {

    }
}
