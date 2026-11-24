import { container } from "../../main/di/container";
import { TYPES } from "../ports/types";
import { AccountService } from "./AccountService";

export = container.get<AccountService>(TYPES.AccountService);
