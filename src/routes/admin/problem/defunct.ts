import express from "express";
import AdminProblemService from "../../../service/admin/AdminProblemService";
const { error, ok } = require("../../../module/constants/state");
const admin = require("../../../middleware/admin");

const router = express.Router();

router.get("/", (req: any, res: any) => {
    res.json(error.errorMaker("You should POST data to server"));
});

router.post("/", async (req: any, res: any) => {
    try {
        const id = parseInt(req.body.id);
        if (!isNaN(id)) {
            await AdminProblemService.toggleProblemDefunct(id);
            res.json(ok.ok);
        } else {
            res.json(error.invalidParams);
        }
    } catch (e) {
        console.log(e);
        res.json(error.database);
    }
});

export = ["/defunct", admin, router];