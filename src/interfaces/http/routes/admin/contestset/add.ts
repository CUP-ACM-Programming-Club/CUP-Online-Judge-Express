import express, {Router} from "express";
import ContestSetController from "../../../controllers/ContestSetController";
const router: Router =  express.Router();

router.post("/", async (req, res) => {
    res.json(await ContestSetController.addContestSet(req));
});

export = ["/add", router];
