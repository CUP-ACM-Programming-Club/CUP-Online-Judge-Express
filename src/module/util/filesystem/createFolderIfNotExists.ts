import fs from "fs";
import {mkdirAsync} from "../../file/mkdir";

export default async function createFolderIfNotExists(folder: string) {
    try {
        await fs.promises.access(folder);
    }
    catch (e) {
        await mkdirAsync(folder);
    }
}
