import express, {IRouter} from "express";
import path from "path";
const routerLoader = require("../router_loader");

class AutoRouterUse {
    newRouter () {
        return express.Router();
    }

    resolveDirRouter(dir: string, paths: string) {
        const router = this.newRouter();
        this.resolveDir(router, dir, paths);
        return router;
    }

    resolveDir(router: IRouter, dir: string, paths: string) {
        routerLoader(router, path.resolve(dir, paths));
        return router;
    }
}

export default new AutoRouterUse();
