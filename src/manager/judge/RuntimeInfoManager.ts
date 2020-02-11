import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import {MySQLManager} from "../mysql/MySQLManager";

interface IRuntimeInfoDAO {
    solution_id: number,
    error: string
}

class RuntimeInfoManager {
    @Cacheable(new CachePool(), 1, "minute")
    async getRuntimeInfoBySolutionId(solutionId: number) {
        const response: IRuntimeInfoDAO[] = await MySQLManager.execQuery(`select * from runtimeinfo where solution_id = ?`, [solutionId]) as any;
        if (response && response.length && response.length > 0) {
            return response[0] as IRuntimeInfoDAO;
        }
        else {
            return null;
        }
    }
}

export default new RuntimeInfoManager();
