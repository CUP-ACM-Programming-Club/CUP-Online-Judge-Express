import {BaseUserSet, IKey} from "./BaseUserSet";

export class ContestPagePushSet extends BaseUserSet {
    removeFromList(key: IKey) {
        const payload = this.get(key);
        if (Array.isArray(payload)) {
            const socketPos = payload.indexOf(payload);
            if (socketPos !== -1) {
                payload.splice(socketPos, 1);
            }
        }
    }
}

const contestPagePushSet = new ContestPagePushSet();

export default contestPagePushSet;
