import express, {Router} from "express";
import ContestSetWithListManager from "../../../manager/contestset/ContestSetWithListManager";
const router: Router = express.Router();

router.post("/", async (req, res) => {
    res.json(await ContestSetWithListManager.updateContestSet(req));
});

export = ["/edit", router];
