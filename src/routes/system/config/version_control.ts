import express, {Router, Request, Response} from "express";
import {error, ok} from "../../../module/constants/state";
import VersionManager from "../../../manager/system/VersionManager";
const router: Router = express. Router();

router.get("/version", async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.version))
    }
    catch {
        res.json(error.internalError);
    }
});

router.get("/git", async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.git))
    }
    catch {
        res.json(error.internalError);
    }
});

router.get("/dependencies", async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.dependencies));
    }
    catch {
        res.json(error.internalError);
    }
});

router.get('/devDependencies', async (req: Request, res: Response) => {
    try {
        res.json(ok.okMaker(VersionManager.devDependencies));
    }
    catch {
        res.json(error.internalError);
    }
});

export = ["/version_control", router];
