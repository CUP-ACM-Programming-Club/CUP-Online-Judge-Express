import express, {Router} from "express";
import ProblemFileManager from "../../../../module/problem/ProblemFileManager";
import multer from "multer";
const router: Router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, global.config.problem_upload_dest.dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
// multer 2 默认按 latin1 解码文件名，显式指定 utf8 以保持 multer 1.4.4 的行为（originalname 直接作为落盘文件名）
const middleware = multer({storage: storage, defParamCharset: "utf8"});

router.post("/:problemId", middleware.single("upload_file"), async (req, res) => {
    res.json(await ProblemFileManager.setFileByRequest(req));
});

router.post("/multiple/:problemId", middleware.array("upload_multiple_file"), async (req, res) => {
    res.json(await ProblemFileManager.setMultipleFileByRequest(req));
})

export = ["/set", router];
