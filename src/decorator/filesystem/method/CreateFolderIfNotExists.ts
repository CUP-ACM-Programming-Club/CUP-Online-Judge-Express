import {folderMetadataKey} from "../parameter/Folder";
import createFolderForFileIfNotExist from "../../../module/util/filesystem/createFolderForFileIfNotExist";
export default function CreateFolderIfNotExists (target: any, propertyName: string, propertyDescriptor: TypedPropertyDescriptor<(...args:any) => Promise<any>>) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = async function (...args: any[]) {
        const folderExistsParameters = Reflect.getOwnMetadata(folderMetadataKey, target, propertyName);
        if (folderExistsParameters) {
            for (let parameterIndex of folderExistsParameters) {
                const destPath = args[parameterIndex];
                await createFolderForFileIfNotExist(destPath);
            }
        }
        return await method!.apply(this, args);
    }
}
