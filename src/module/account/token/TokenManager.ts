import { container } from "../../../di/container";
import { TYPES } from "../../../di/types";
import { TokenManagerService } from "./TokenManagerService";

export default container.get<TokenManagerService>(TYPES.TokenManager);
