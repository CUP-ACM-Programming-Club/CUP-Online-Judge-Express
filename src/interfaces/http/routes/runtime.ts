import express, { Request, Response } from "express";

const router = express.Router();
import auth from "../middleware/auth";

router.get("/:id", (req: Request, res: Response) => {
    // Placeholder for runtime info
});

export = ["/runtime", auth, router];
