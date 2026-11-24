import { injectable } from "inversify";
import redisClient, { IRedis } from "../redis";

@injectable()
export class RedisService {
    public get client(): IRedis {
        return redisClient;
    }
}
