import express from "express";
import AdminUserService from "../../../service/admin/AdminUserService";
const { error, ok } = require("../../../module/constants/state");
const admin = require("../../../middleware/admin");

const router = express.Router();

router.get("/", (req: any, res: any) => {
    res.json(error.errorMaker("You should POST data to server"));
});

router.post("/", async (req: any, res: any) => {
    try {
        const id = req.body.id; // user_id is string
        if (id) {
            await AdminUserService.toggleUserDefunct(id);
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