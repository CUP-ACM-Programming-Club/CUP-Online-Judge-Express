import { Container } from "inversify";
import { TYPES } from "./types";
import { AccountService } from "../module/account/AccountService";
import { ConfigService } from "../service/ConfigService";
import { RedisService } from "../module/redis/RedisService";
import { TokenManagerService } from "../module/account/token/TokenManagerService";
import { AuthService } from "../module/auth/AuthService";
import { RegisterService } from "../module/auth/RegisterService";
import { UserManager } from "../manager/user/UserManager";

const container = new Container();
container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
container.bind<AccountService>(TYPES.AccountService).to(AccountService).inSingletonScope();
container.bind<RedisService>(TYPES.RedisService).to(RedisService).inSingletonScope();
container.bind<TokenManagerService>(TYPES.TokenManager).to(TokenManagerService).inSingletonScope();
container.bind<AuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind<RegisterService>(TYPES.RegisterService).to(RegisterService).inSingletonScope();
container.bind<UserManager>(TYPES.UserManager).to(UserManager).inSingletonScope();

export { container };
