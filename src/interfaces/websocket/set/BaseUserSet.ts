export type IKey = number | string;

export interface IUserList<T> {
    [id: string]: T
}

export class BaseUserSet<Type = any> {
    private readonly userList: IUserList<Type> = {};
    constructor() {

    }

    has(key: IKey) {
        return !!this.userList[key];
    }

    get(key: IKey, defaultValue?: any) {
        if (!Object.prototype.hasOwnProperty.call(this.userList, key)) {
            if (defaultValue) {
                this.set(key, defaultValue);
            }
            else {
                return null;
            }
        }
        return this.userList[key];
    }

    set(key: IKey, payload: any) {
        this.userList[key] = payload;
        return this;
    }

    remove(key: IKey) {
        if (Object.prototype.hasOwnProperty.call(this.userList, key)) {
            delete this.userList[key];
        }
        return this;
    }

    delete(key: IKey) {
        return this.remove(key);
    }

    getInnerStorage() {
        return this.userList;
    }
}

const baseUserSet = new BaseUserSet();

export default baseUserSet;
