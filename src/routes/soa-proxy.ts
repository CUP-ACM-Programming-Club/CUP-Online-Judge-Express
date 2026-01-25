import AutoRouterUse from "../module/common/AutoRouterUse";
const router = AutoRouterUse.newRouter();
import auth from "../middleware/auth";

router.get("/", async (req, res) => {
    res.json("t");
})

AutoRouterUse.resolveDir(router, __dirname, "./soa-proxy");
export = ["/soa-proxy", router];
