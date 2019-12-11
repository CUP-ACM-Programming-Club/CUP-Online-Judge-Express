import CachePool from "../common/CachePool";
import ClusterSynchronizeClass from "../../decorator/ClusterSynchronizeClass";
import ClusterSynchronize from "../../decorator/ClusterSynchronize";
@ClusterSynchronizeClass
class MySQLCachePool extends CachePool {
    @ClusterSynchronize
    async set(key: string, value: any) {
        return super.set(key, value);
    }
}
export = new MySQLCachePool();
