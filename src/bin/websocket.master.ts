import cluster from "cluster";
import net from "net";

const clusterCompat: any = cluster;
const isPrimary: boolean =
    clusterCompat.isPrimary !== undefined ? clusterCompat.isPrimary : clusterCompat.isMaster;

async function main() {
    if (isPrimary) {
        require("../module/init/preinstall")();
        require("../module/init/build_env")();
        require("../module/config/transfer/ClusterTransfer")();
        require("../module/config/cluster/websocket-reload");

    }
    else {

    }
}
