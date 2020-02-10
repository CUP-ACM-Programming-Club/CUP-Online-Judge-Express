import express, {Router} from "express";
import ContestSetWithListManager from "../../../manager/contestset/ContestSetWithListManager";
const router: Router =  express.Router();

router.post("/", async (req, res) => {
    res.json(await ContestSetWithListManager.addContestSet(req));
});

export = ["/add", router];
