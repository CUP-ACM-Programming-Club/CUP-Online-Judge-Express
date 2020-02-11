import {MySQLManager} from "../mysql/MySQLManager";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";

interface ICompileInfoDAO {
    solution_id: number,
    error: string
}

class CompileInfoManager {
    @Cacheable(new CachePool(), 1, "minute")
    async getCompileInfoBySolutionId(solutionId: number)  {
        const response: ICompileInfoDAO[] = await MySQLManager.execQuery(`select * from compileinfo where solution_id = ?`, [solutionId]) as any;
        if (response && response.length && response.length > 0) {
            return response[0] as ICompileInfoDAO;
        }
        else {
            return null;
        }
    }
}

export default new CompileInfoManager();
