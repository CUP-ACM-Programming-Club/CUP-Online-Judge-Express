/**
 * SubmissionService 测试用：在 Module._load 拦截生效期间重新加载提交相关的仓储 / 适配器并绑定到端口，
 * 使 mysql_cache / MySQLManager / redis / ContestManager 的 stub 继续生效。返回恢复函数。
 */
import { rebindFresh } from "./rebind-port";
import {
	submissionContestLookup,
	submissionLoginTokens,
	submissionSubmitRepository
} from "../../application/ports/SubmissionSubmitRepository";
import { submissionQueryRepository } from "../../application/ports/SubmissionQueryRepository";

export function rebindSubmissionServicePorts(): () => void {
	const restores = [
		rebindFresh(submissionSubmitRepository, require.resolve("../../infrastructure/persistence/submission/MySqlSubmissionSubmitRepository"), m => new m.MySqlSubmissionSubmitRepository()),
		rebindFresh(submissionLoginTokens, require.resolve("../../infrastructure/persistence/submission/RedisSubmissionLoginTokens"), m => new m.RedisSubmissionLoginTokens()),
		rebindFresh(submissionContestLookup, require.resolve("../../infrastructure/persistence/submission/SubmissionContestLookupAdapter"), m => new m.SubmissionContestLookupAdapter()),
		rebindFresh(submissionQueryRepository, require.resolve("../../infrastructure/persistence/submission/MySqlSubmissionQueryRepository"), m => new m.MySqlSubmissionQueryRepository())
	];
	return () => restores.reverse().forEach(restore => restore());
}
