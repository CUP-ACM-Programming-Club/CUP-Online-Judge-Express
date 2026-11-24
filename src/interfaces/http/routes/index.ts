import express, { Request, Response } from "express";

const router = express.Router();

router.get("/", function (req: Request, res: Response) {
	res.render("index", { title: "CUP Online Judge", header: "API" });
});

export = ["/", router];
