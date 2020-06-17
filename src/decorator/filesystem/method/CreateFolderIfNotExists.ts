import {folderMetadataKey} from "../parameter/Folder";
import fs from "fs";
import path from "path";
import {mkdirAsync} from "../../../module/file/mkdir";
export default function CreateFolderIfNotExists (target: any, propertyName: string, propertyDescriptor: TypedPropertyDescriptor<(...args:any) => Promise<any>>) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args: any[]) {
        const folderExistsParameters = Reflect.getOwnMetadata(folderMetadataKey, target, propertyName);
        if (folderExistsParameters) {
            for (let parameterIndex of folderExistsParameters) {
                const destPath = args[parameterIndex];
                const destDirName = path.dirname(destPath);
                try {
                    await fs.promises.access(destDirName);
                }
                catch (e) {
                    await mkdirAsync(destDirName);
                }
            }
        }
        return await method!.apply(this, args);
    }
}
