import AutoRouterUse from "../AutoRouterUse";
import { requireAdmin } from "../middleware/policy";
const router = AutoRouterUse.newRouter();
import auth from "../middleware/auth";
router.use(requireAdmin);

AutoRouterUse.resolveDir(router, __dirname, "./setting");
export = ["/setting", auth, router];
