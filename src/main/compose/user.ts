/**
 * 组装根：user 领域的端口绑定。由 main/compose.ts 引入。
 */
import { bindPort } from "../../application/ports/registry";
import { lazy } from "./lazy";
import { userRepository } from "../../application/ports/UserRepository";
import { userAccountRepository } from "../../application/ports/UserAccountRepository";
import { userTokenStore, userLegacyTokenCache } from "../../application/ports/UserTokenStore";
import { userBanRepository } from "../../application/ports/UserBanRepository";
import { userInviteRepository } from "../../application/ports/UserInviteRepository";
import { userPrivilegeRepository } from "../../application/ports/UserPrivilegeRepository";
import { userInitSetup, UserInitSetup } from "../../application/ports/UserInitSetup";
import { userLoginLogRepository } from "../../application/ports/UserLoginLogRepository";
import { userQueryRepository } from "../../application/ports/UserQueryRepository";
import { adminUserRepository } from "../../application/ports/AdminUserRepository";
import { legacyUtilRepository } from "../../application/ports/LegacyUtilRepository";

bindPort(userRepository, lazy(() => new (require("../../infrastructure/persistence/user/MySqlUserRepository").MySqlUserRepository)()));
bindPort(userAccountRepository, lazy(() => new (require("../../infrastructure/persistence/user/SequelizeUserAccountRepository").SequelizeUserAccountRepository)()));
bindPort(userTokenStore, lazy(() => new (require("../../infrastructure/persistence/user/RedisUserTokenStore").RedisUserTokenStore)()));
bindPort(userLegacyTokenCache, lazy(() => new (require("../../infrastructure/persistence/user/MemcachedUserLegacyTokenCache").MemcachedUserLegacyTokenCache)()));
bindPort(userBanRepository, lazy(() => new (require("../../infrastructure/persistence/user/MySqlUserBanRepository").MySqlUserBanRepository)()));
bindPort(userInviteRepository, lazy(() => require("../../infrastructure/persistence/user/InviteManager").default));
bindPort(userPrivilegeRepository, lazy(() => require("../../infrastructure/persistence/user/PrivilegeManager").default));
bindPort(userLoginLogRepository, lazy(() => require("../../infrastructure/persistence/user/record/LoginLogManager").default));
bindPort(userQueryRepository, lazy(() => new (require("../../infrastructure/persistence/user/MySqlUserQueryRepository").MySqlUserQueryRepository)()));
bindPort(adminUserRepository, lazy(() => new (require("../../infrastructure/persistence/user/MySqlAdminUserRepository").MySqlAdminUserRepository)()));
bindPort(legacyUtilRepository, lazy(() => new (require("../../infrastructure/persistence/user/MySqlLegacyUtilRepository").MySqlLegacyUtilRepository)()));

// 首次安装：init 标记沿用 main/init/manager/InitManager，配置文件写入走 ConfigFileManager
bindPort(userInitSetup, lazy((): UserInitSetup => {
	const InitManager = require("../init/manager/InitManager").default;
	const ConfigFileManager = require("../../infrastructure/config/file/ConfigFileManager").default;
	return {
		setInitFlag: (init: boolean) => InitManager.setInitFlag(init),
		writeConfigFile: (content: any) => ConfigFileManager.writeConfigToFile(content)
	};
}));
