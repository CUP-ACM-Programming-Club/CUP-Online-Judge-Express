import { container } from "../../../main/di/container";
import { TYPES } from "../../ports/types";
import { TokenManagerService } from "./TokenManagerService";

export default container.get<TokenManagerService>(TYPES.TokenManager);
