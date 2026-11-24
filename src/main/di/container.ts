import { Container } from "inversify";
import { TYPES } from "./types";
import { AccountService } from "../../application/account/AccountService";
import { ConfigService } from "../../application/services/ConfigService";
import { RedisService } from "../../infrastructure/redis/service/RedisService";
import { TokenManagerService } from "../../application/account/token/TokenManagerService";
import { AuthService } from "../../application/auth/AuthService";
import { RegisterService } from "../../application/auth/RegisterService";
import { UserManager } from "../../infrastructure/persistence/user/UserManager";

const container = new Container();
container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
container.bind<AccountService>(TYPES.AccountService).to(AccountService).inSingletonScope();
container.bind<RedisService>(TYPES.RedisService).to(RedisService).inSingletonScope();
container.bind<TokenManagerService>(TYPES.TokenManager).to(TokenManagerService).inSingletonScope();
container.bind<AuthService>(TYPES.AuthService).to(AuthService).inSingletonScope();
container.bind<RegisterService>(TYPES.RegisterService).to(RegisterService).inSingletonScope();
container.bind<UserManager>(TYPES.UserManager).to(UserManager).inSingletonScope();

export { container };
