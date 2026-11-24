import express, { Router } from "express";
import path from "path";
import auth from "../middleware/auth";
const router: Router = express.Router();

require("../router_loader")(router, path.resolve(__dirname, "./contestset"));

export = ["/contestset", auth, router];
