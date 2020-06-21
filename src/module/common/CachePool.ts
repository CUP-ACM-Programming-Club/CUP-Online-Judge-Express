import {Dayjs} from "dayjs";
import Lock from "../../decorator/Lock";
import SegmentLock from "./SegmentLock";
import _ from "lodash";
import dayjs from "dayjs";
const segLock = new SegmentLock();

interface CacheValue<T = any> {
    data: T,
    time: Dayjs
}

export interface ICachePool<T = any> {
	get(key: string): Promise<CacheValue<T> | undefined | null>;
	getAllKey(): any[];
	setWithTimestamp(key: string, value: any, timestamp: number): Promise<void>;
	set(key: string, value: any): Promise<void>;
	remove(key: string): void;
	removeAll(): void;
}

interface Cache<T = any> {
    [id: string]: CacheValue<T> | undefined
}

function InitCache(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = function (this: any, ...args: any[]) {
        if (typeof this.__cache__ === "undefined" || this.__cache__ === null) {
            this.__cache__ = {};
        }
        return method.apply(this, args);
    }
}

class CachePool<T = any> implements ICachePool{
    private __cache__: Cache;

    constructor() {
        this.__cache__ = {};
    }

    @InitCache
    @Lock(segLock)
    async get(key: string) {
        if (this.__cache__ && Object.prototype.hasOwnProperty.call(this.__cache__, key) && this.__cache__[key]) {
            return this.__cache__[key];
        } else {
            return null;
        }
    }

    @InitCache
    getAllKey() {
        return Object.keys(this.__cache__);
    }

    @InitCache
    async _set(key: string, value: any) {
        this.__cache__[key] = {
            data: _.cloneDeep(value),
            time: dayjs()
        };
    }

    @InitCache
    async setWithTimestamp(key: string, value: any, timestamp: number) {
        const prevPayload = this.__cache__[key];
        if (!prevPayload || (timestamp && prevPayload.time.isBefore(dayjs(timestamp)))) {
            return this._set(key, value);
        }
    }

    @InitCache
    @Lock(segLock)
    async set(key: string, value: any) {
        this._set(key, value);
    }

    @InitCache
    remove(key: string) {
        if (this.__cache__ && Object.prototype.hasOwnProperty.call(this.__cache__, key) && this.__cache__[key]) {
            this.__cache__[key] = undefined;
        }
    }

    @InitCache
    removeAll() {
        this.__cache__ = {};
    }
}

export default CachePool;
