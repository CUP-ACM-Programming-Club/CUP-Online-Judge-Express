/**
 * 题面图片的读写（website.dir/images/<题号>/<类型>）。
 * 写入逻辑来自 application/services/ProblemManageService，读取逻辑来自 interfaces/http/routes/photo，行为不变。
 */
import path from "path";
import { dataUriToImageFile, imageFileToDataUri } from "./base64Image";
import { mkdirAsync } from "./file/mkdir";
import { ProblemImage, ProblemImageStorage } from "../../application/ports/ProblemImageStorage";
const bluebird = require("bluebird");
const fs = bluebird.promisifyAll(require("fs"));
const isImage = require("is-image");

function imageDir() {
    return path.join(global.config.website.dir, "images");
}

export class FsProblemImageStorage implements ProblemImageStorage {
    async saveImage(problem_id: any, type: any, key: any, data: any) {
        const picPath = path.join(imageDir(), problem_id.toString(), type);

        await mkdirAsync(picPath);
        try {
            await dataUriToImageFile(data, picPath, key);
        } catch (e) {
            console.log(e);
        }
    }

    async readImages(problem_id: any, key: any): Promise<ProblemImage[]> {
        const dirPath = path.join(imageDir(), problem_id.toString(), key);
        await mkdirAsync(dirPath);
        const photoList = (await fs.readdirAsync(dirPath)).filter((el: any) => isImage(el));
        return await Promise.all(photoList.map(async (el: any) => {
            return {
                name: path.basename(el).substring(0, el.lastIndexOf(".")),
                data: await imageFileToDataUri(path.join(dirPath, el))
            };
        }));
    }
}
