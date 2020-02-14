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
const middleware = multer({storage: storage});

router.post("/:problemId", middleware.single("upload_file"), async (req, res) => {
    res.json(await ProblemFileManager.setFileByRequest(req));
});

export = ["/set", router];
