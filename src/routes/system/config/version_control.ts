import express, {Router, Request, Response} from "express";
import {error, ok} from "../../../module/constants/state";
import VersionManager from "../../../manager/system/VersionManager";
import { requireAdmin } from "../../../policy/middleware";
const router: Router = express. Router();

// /version 由前端“版本控制”页匿名调用，保持公开；仓库地址与依赖版本只给管理员（phase5 fix b）

router.get("/version", async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.version))
    }
    catch {
        res.json(error.internalError);
    }
});

router.get("/git", requireAdmin, async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.git))
    }
    catch {
        res.json(error.internalError);
    }
});

router.get("/dependencies", requireAdmin, async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.dependencies));
    }
    catch {
        res.json(error.internalError);
    }
});

router.get('/devDependencies', requireAdmin, async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.devDependencies));
    }
    catch {
        res.json(error.internalError);
    }
});

export = ["/version_control", router];
