import {IKey} from "../set/BaseUserSet";

export class StatusSet {
    private __list__: any = [];
    get(key: IKey) {
        return this.__list__[key];
    }

    getList() {
        return this.__list__;
    }

    push(payload: any) {
        this.__list__.push(payload);
        return this;
    }

    remove(socket: any) {
        const socketPos = this.__list__.indexOf(socket);
        if (socketPos !== -1) {
            this.__list__.splice(socketPos, 1);
        }
    }

    reset() {
        this.__list__ = [];
    }
}

export default new StatusSet();
