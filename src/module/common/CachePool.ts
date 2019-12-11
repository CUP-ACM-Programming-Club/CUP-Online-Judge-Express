import {Dayjs} from "dayjs";
import Lock from "../../decorator/Lock";

const dayjs = require("dayjs");
const SegmentLock = require("./SegmentLock");
const segLock = new SegmentLock();

interface CacheValue {
    data: any,
    time: Dayjs
}

export interface ICachePool {
	get(key: string): Promise<CacheValue | undefined | null>;
	getAllKey(): any[];
	setWithTimestamp(key: string, value: any, timestamp: number): Promise<void>;
	set(key: string, value: any): Promise<void>;
	remove(key: string): void;
	removeAll(): void;
}

interface Cache {
    [id: string]: CacheValue | undefined
}

class CachePool implements ICachePool{
    private __cache__: Cache;

    constructor() {
        this.__cache__ = {};
    }

    @Lock(segLock)
    async get(key: string) {
        if (this.__cache__ && Object.prototype.hasOwnProperty.call(this.__cache__, key) && this.__cache__[key]) {
            return this.__cache__[key];
        } else {
            return null;
        }
    }

    getAllKey() {
        return Object.keys(this.__cache__);
    }

    async setWithTimestamp(key: string, value: any, timestamp: number) {
        const prevPayload = this.__cache__[key];
        if (!prevPayload || (timestamp && prevPayload.time.isBefore(dayjs(timestamp)))) {
            await this.set(key, value);
        }
    }

    @Lock(segLock)
    async set(key: string, value: any) {
        this.__cache__[key] = {
            data: value,
            time: dayjs()
        };
    }

    remove(key: string) {
        if (this.__cache__ && Object.prototype.hasOwnProperty.call(this.__cache__, key) && this.__cache__[key]) {
            this.__cache__[key] = undefined;
        }
    }

    removeAll() {
        this.__cache__ = {};
    }
}

export default CachePool;
