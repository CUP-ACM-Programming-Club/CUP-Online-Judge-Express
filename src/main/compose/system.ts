/**
 * 组装根：system 领域的端口绑定。由 main/compose.ts 引入。
 */
import { bindPort } from "../../application/ports/registry";
import { lazy } from "./lazy";


import { adminTableRepository } from "../../application/ports/AdminTableRepository";
bindPort(adminTableRepository, lazy(() => new (require("../../infrastructure/persistence/admin/MySqlAdminTableRepository").MySqlAdminTableRepository)()));

import { globalSettingRepository } from "../../application/ports/GlobalSettingRepository";
bindPort(globalSettingRepository, lazy(() => new (require("../../infrastructure/persistence/system/MySqlGlobalSettingRepository").MySqlGlobalSettingRepository)()));

import { processControl } from "../../application/ports/ProcessControl";
bindPort(processControl, lazy(() => require("../cluster/hot-reload")));

import { configFile } from "../../application/ports/ConfigFile";
bindPort(configFile, lazy(() => require("../../infrastructure/config/file/ConfigFileManager").default));

import { queryCache } from "../../application/ports/QueryCache";
bindPort(queryCache, lazy(() => require("../../infrastructure/cache/MySQLCacheManager")));

import { systemLog, versionInfo } from "../../application/ports/SystemInfo";
bindPort(systemLog, lazy(() => require("../../infrastructure/persistence/system/LogManager").default));
bindPort(versionInfo, lazy(() => require("../../infrastructure/persistence/system/VersionManager").default));

import { helloRpc } from "../../application/ports/HelloRpc";
bindPort(helloRpc, lazy(() => require("../../infrastructure/integration/hello/HelloService").default));

import { awardRepository } from "../../application/ports/AwardRepository";
bindPort(awardRepository, lazy(() => new (require("../../infrastructure/persistence/award/MySqlAwardRepository").MySqlAwardRepository)()));
