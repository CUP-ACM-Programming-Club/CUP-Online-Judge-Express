import { container } from "../../di/container";
import { TYPES } from "../../di/types";
import { AccountService } from "./AccountService";

export = container.get<AccountService>(TYPES.AccountService);
