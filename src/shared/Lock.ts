import AwaitLock from "await-lock";

export interface ILock {
    getLock(key: string): Promise<void>;
    release(key: string): void;
}

export default class Lock implements ILock {
    private lock: AwaitLock = new AwaitLock();
    async getLock(key: string) {
        await this.lock.acquireAsync();
    }

    release(key: string) {
        this.lock.release();
    }
}
