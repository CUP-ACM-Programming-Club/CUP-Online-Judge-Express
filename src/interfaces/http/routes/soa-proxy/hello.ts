import express from "express";
import { helloRpc as HelloService } from "../../../../application/ports/HelloRpc";
const router = express.Router();

router.get("/:name", async (req, res) => {
    console.log("test");
    res.json(await HelloService.sayHello(req.params.name));
});


export = ["/hello", router];
