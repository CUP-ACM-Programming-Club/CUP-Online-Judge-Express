import express, { Request, Response } from "express";

const router = express.Router();
const auth = require("../middleware/auth");

router.get("/:id", (req: Request, res: Response) => {
    // Placeholder for runtime info
});

export = ["/runtime", auth, router];
