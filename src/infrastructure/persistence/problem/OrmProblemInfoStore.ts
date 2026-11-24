/** ProblemInfoStore 的实现：委托 ProblemInfoManager（ORM + 进程内缓存）。 */
import { ProblemInfoRecord, ProblemInfoStore } from "../../../application/ports/ProblemInfoStore";
import ProblemInfoManager = require("./ProblemInfoManager");

export class OrmProblemInfoStore implements ProblemInfoStore {
    find(problemId: any): Promise<ProblemInfoRecord | null> {
        return ProblemInfoManager.newInstance().setProblemId(problemId).find();
    }

    removeCache(problemId: any) {
        ProblemInfoManager.newInstance().setProblemId(problemId).removeCache();
    }
}
