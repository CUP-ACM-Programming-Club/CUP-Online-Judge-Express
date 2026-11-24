import AutoRouterUse from "../module/common/AutoRouterUse";
import { requireAdmin } from "../policy/middleware";
const router = AutoRouterUse.newRouter();
import auth from "../middleware/auth";
router.use(requireAdmin);

AutoRouterUse.resolveDir(router, __dirname, "./setting");
export = ["/setting", auth, router];
