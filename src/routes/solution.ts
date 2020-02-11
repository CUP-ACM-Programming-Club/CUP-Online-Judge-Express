import express, {Router} from "express";
import path from "path";
const router: Router = express.Router();
const auth = require("../middleware/auth");
require("../module/router_loader")(router, path.resolve(__dirname, "./solution"));
export = ["/solution", auth, router];
