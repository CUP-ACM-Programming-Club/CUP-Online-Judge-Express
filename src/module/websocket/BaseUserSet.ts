export type IKey = number | string;

export interface IUserList {
    [id: string]: any
}

export class BaseUserSet {
    private readonly userList: IUserList = {};
    constructor() {

    }

    has(key: IKey) {
        return !!this.userList[key];
    }

    get(key: IKey) {
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
