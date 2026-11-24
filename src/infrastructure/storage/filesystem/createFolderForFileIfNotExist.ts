import path from "path";
import createFolderIfNotExists from "./createFolderIfNotExists";

export default async function createFolderForFileIfNotExists(folder: string) {
    const destDirName = path.dirname(folder);
    return await createFolderIfNotExists(destDirName);
}
