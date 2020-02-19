import express from "express";
import {ok} from "../module/constants/state";

const router = express.Router();
const auth = require("../middleware/auth");

router.get("/", (req, res) => {
    res.json(ok.okMaker({
        admin: req.session!.isadmin
    }));
});

export = ["/privilege", auth, router];
