/**
 * 组装根：problem 领域的端口绑定。由 main/compose.ts 引入。
 */
import { bindPort } from "../../application/ports/registry";
import { lazy } from "./lazy";
import { problemRepository } from "../../application/ports/ProblemRepository";
import { problemManageRepository } from "../../application/ports/ProblemManageRepository";
import { adminProblemRepository } from "../../application/ports/AdminProblemRepository";
import { problemInfoStore } from "../../application/ports/ProblemInfoStore";
import { problemResultCache } from "../../application/ports/ProblemResultCache";
import { problemSourcePrivilege } from "../../application/ports/ProblemSourcePrivilege";
import { problemDataStorage } from "../../application/ports/ProblemDataStorage";
import { problemImportStorage } from "../../application/ports/ProblemImportStorage";
import { problemImageStorage } from "../../application/ports/ProblemImageStorage";
import { problemPrefileRepository } from "../../application/ports/ProblemPrefileRepository";
import { problemSetRepository } from "../../application/ports/ProblemSetRepository";
import { topicRepository } from "../../application/ports/TopicRepository";
import { tutorialRepository } from "../../application/ports/TutorialRepository";
import { specialSubjectRepository } from "../../application/ports/SpecialSubjectRepository";

bindPort(problemRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlProblemRepository").MySqlProblemRepository)()));
bindPort(problemManageRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlProblemManageRepository").MySqlProblemManageRepository)()));
bindPort(adminProblemRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlAdminProblemRepository").MySqlAdminProblemRepository)()));
bindPort(problemInfoStore, lazy(() => new (require("../../infrastructure/persistence/problem/OrmProblemInfoStore").OrmProblemInfoStore)()));
bindPort(problemResultCache, lazy(() => new (require("../../infrastructure/cache/NodeProblemResultCache").NodeProblemResultCache)()));
bindPort(problemSourcePrivilege, lazy(() => new (require("../../infrastructure/persistence/problem/SubmissionSourcePrivilegeAdapter").SubmissionSourcePrivilegeAdapter)()));
// ProblemFileManager 的 @RunOnceEachKeyAsync 按实例记忆已建目录，沿用模块单例
bindPort(problemDataStorage, lazy(() => require("../../infrastructure/storage/ProblemFileManager").default));
bindPort(problemImportStorage, lazy(() => new (require("../../infrastructure/storage/FsProblemImportStorage").FsProblemImportStorage)()));
bindPort(problemImageStorage, lazy(() => new (require("../../infrastructure/storage/FsProblemImageStorage").FsProblemImageStorage)()));
bindPort(problemPrefileRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlProblemPrefileRepository").MySqlProblemPrefileRepository)()));
bindPort(problemSetRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlProblemSetRepository").MySqlProblemSetRepository)()));
bindPort(topicRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlTopicRepository").MySqlTopicRepository)()));
bindPort(tutorialRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlTutorialRepository").MySqlTutorialRepository)()));
bindPort(specialSubjectRepository, lazy(() => new (require("../../infrastructure/persistence/problem/MySqlSpecialSubjectRepository").MySqlSpecialSubjectRepository)()));
