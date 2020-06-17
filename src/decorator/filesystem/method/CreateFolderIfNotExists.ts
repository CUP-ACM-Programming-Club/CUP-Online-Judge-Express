import {folderMetadataKey} from "../parameter/Folder";
import fs from "fs";
export default function CreateFolderIfNotExists (target: any, propertyName: string, propertyDescriptor: TypedPropertyDescriptor<(...args:any) => Promise<any>>) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args: any[]) {
        const folderExistsParameters = Reflect.getOwnMetadata(folderMetadataKey, target, propertyName);
        if (folderExistsParameters) {
            for (let parameterIndex of folderExistsParameters) {
                const dest = args[parameterIndex];
                try {
                    await fs.promises.access(dest);
                }
                catch (e) {
                    await fs.promises.mkdir(dest);
                }
            }
        }
        return await method!.apply(this, args);
    }
}
