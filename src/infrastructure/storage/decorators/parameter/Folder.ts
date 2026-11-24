import "reflect-metadata";
export const folderMetadataKey = Symbol("folder");

export default function Folder(target: Object, propertyKey: string | symbol, parameterIndex: number) {
    const existingFolderParameters = Reflect.getOwnMetadata(folderMetadataKey, target, propertyKey) || [];
    existingFolderParameters.push(parameterIndex);
    Reflect.defineMetadata(folderMetadataKey, existingFolderParameters, target, propertyKey);
}
