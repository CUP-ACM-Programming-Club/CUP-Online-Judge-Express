import express, {Router} from "express";
import path from "path";
const router:Router = express.Router();
const admin = require("../../middleware/admin");

require("../../module/router_loader")(router, path.resolve(__dirname, "./contestset"));
export = ["/contestset", admin, router];
