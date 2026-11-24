import { container } from "../../main/di/container";
import { TYPES } from "../../main/di/types";
import { AccountService } from "./AccountService";

export = container.get<AccountService>(TYPES.AccountService);
