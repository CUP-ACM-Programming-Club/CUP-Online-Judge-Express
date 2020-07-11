import AutoRouterUse from "../module/common/AutoRouterUse";
import {error} from "../module/constants/state";
const router = AutoRouterUse.newRouter();
const auth = require("../middleware/auth");
router.use((req, res, next) => {
	if (!req.session!.isadmin) {
		res.json(error.noprivilege);
	} else {
		next();
	}
});

AutoRouterUse.resolveDir(router, __dirname, "./setting");
export = ["/setting", auth, router];
