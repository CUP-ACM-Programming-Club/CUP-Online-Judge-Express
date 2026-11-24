/**
 * 组装根：submission 领域的端口绑定。由 main/compose.ts 引入。
 */
import { bindPort } from "../../application/ports/registry";
import { lazy } from "./lazy";
import { submissionJudger, judgerEventListener } from "../../application/ports/SubmissionJudger";
import { judgeResultNotifier, judgeStateLog } from "../../application/ports/JudgeResultNotifier";
import { submissionBanUser } from "../../application/ports/SubmissionBanUser";
import { judgeQueueRepository } from "../../application/ports/JudgeQueueRepository";
import { judgeResultRepository } from "../../application/ports/JudgeResultRepository";
import { submissionUserRepository } from "../../application/ports/SubmissionUserRepository";
import { submissionGraphData } from "../../application/ports/SubmissionGraphData";
import { submissionStatusRepository } from "../../application/ports/SubmissionStatusRepository";
import { ranklistRepository } from "../../application/ports/RanklistRepository";
import { submissionProblemStatusRepository } from "../../application/ports/SubmissionProblemStatusRepository";
import {
	submissionContestLookup,
	submissionLoginTokens,
	submissionSubmitRepository
} from "../../application/ports/SubmissionSubmitRepository";
import { submissionQueryRepository } from "../../application/ports/SubmissionQueryRepository";
import { submissionSourcePrivilege } from "../../application/ports/SubmissionSourcePrivilege";
import { submissionSolutionRepository } from "../../application/ports/SubmissionSolutionRepository";
import { submissionExportRepository } from "../../application/ports/SubmissionExportRepository";
import { compileArgumentsStore } from "../../application/ports/CompileArgumentsStore";
import { submissionSolveMap } from "../../application/ports/SubmissionSolveMap";

// ---- 判题链路：判题机客户端 ⇄ application ⇄ WebSocket 推送 ----
bindPort(submissionJudger, lazy(() => require("../../infrastructure/judger/localJudger").default));
bindPort(judgerEventListener, lazy(() => require("../../application/judging/JudgeEventUseCases").default));
bindPort(judgeResultNotifier, lazy(() => require("../../interfaces/websocket/managers/JudgeResultManager").default));
bindPort(judgeStateLog, lazy(() => require("../../infrastructure/logging/log4j").default));
bindPort(submissionBanUser, lazy(() => new (require("../../infrastructure/persistence/submission/SubmissionBanUserAdapter").SubmissionBanUserAdapter)()));

// ---- 数据访问 ----
bindPort(judgeQueueRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlJudgeQueueRepository").MySqlJudgeQueueRepository)()));
bindPort(judgeResultRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlJudgeResultRepository").MySqlJudgeResultRepository)()));
bindPort(submissionUserRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlSubmissionUserRepository").MySqlSubmissionUserRepository)()));
bindPort(submissionGraphData, lazy(() => new (require("../../infrastructure/persistence/submission/graph_data_optimizer").MySqlSubmissionGraphData)()));
bindPort(submissionStatusRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlSubmissionStatusRepository").MySqlSubmissionStatusRepository)()));
bindPort(ranklistRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlRanklistRepository").MySqlRanklistRepository)()));
bindPort(submissionProblemStatusRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlSubmissionProblemStatusRepository").MySqlSubmissionProblemStatusRepository)()));
bindPort(submissionSubmitRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlSubmissionSubmitRepository").MySqlSubmissionSubmitRepository)()));
bindPort(submissionLoginTokens, lazy(() => new (require("../../infrastructure/persistence/submission/RedisSubmissionLoginTokens").RedisSubmissionLoginTokens)()));
bindPort(submissionContestLookup, lazy(() => new (require("../../infrastructure/persistence/submission/SubmissionContestLookupAdapter").SubmissionContestLookupAdapter)()));
bindPort(submissionQueryRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlSubmissionQueryRepository").MySqlSubmissionQueryRepository)()));
bindPort(submissionSourcePrivilege, lazy(() => require("../../infrastructure/persistence/submission/SourcePrivilegeCache").default));
bindPort(submissionSolutionRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlSubmissionSolutionRepository").MySqlSubmissionSolutionRepository)()));
bindPort(submissionExportRepository, lazy(() => new (require("../../infrastructure/persistence/submission/MySqlSubmissionExportRepository").MySqlSubmissionExportRepository)()));
bindPort(compileArgumentsStore, lazy(() => require("../../infrastructure/persistence/judge/CompilerManager").default));
bindPort(submissionSolveMap, lazy(() => require("../../infrastructure/persistence/SolveMap/SolveMapManager").default));
