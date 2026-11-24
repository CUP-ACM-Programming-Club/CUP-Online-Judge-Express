/** ProblemSourcePrivilege 的实现：委托 submission 领域的 SourcePrivilegeCache。 */
import { ProblemSourcePrivilege } from "../../../application/ports/ProblemSourcePrivilege";
import SourcePrivilegeCache from "../submission/SourcePrivilegeCache";

export class SubmissionSourcePrivilegeAdapter implements ProblemSourcePrivilege {
    checkPrivilege(session: any, solutionId: number) {
        return SourcePrivilegeCache.checkPrivilege(session, solutionId);
    }
}
