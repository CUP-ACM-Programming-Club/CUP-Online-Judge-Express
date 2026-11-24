import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", function (req: Request, res: Response) {
	res.render("homepage", { title: "CUP Online Judge", OJ_NAME: "CUP Online Judge" });
});

export = ["/homepage", router];
