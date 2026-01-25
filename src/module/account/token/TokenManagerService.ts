import { injectable, inject } from "inversify";
import { TYPES } from "../../../di/types";
import { RedisService } from "../../redis/RedisService";

const ListSize = 50;

@injectable()
export class TokenManagerService {
    private _redisService: RedisService;

    constructor(@inject(TYPES.RedisService) redisService: RedisService) {
        this._redisService = redisService;
    }

    async removeToken(userId: string) {
        const client = this._redisService.client;
        let size = await client.llenAsync(`${userId}newToken`);
        while (size-- > 0) {
            await client.lpopAsync(`${userId}newToken`);
        }
        size = await client.llenAsync(`${userId}token`);
        while (size-- > 0) {
            await client.lpopAsync(`${userId}token`);
        }
    }

    async storeToken(userId: string, hash: string) {
        const client = this._redisService.client;
        await client.rpushAsync(`${userId}newToken`, hash);
        let size = await client.llenAsync(`${userId}newToken`);
        size -= ListSize;
        while (size-- > 0) {
            await client.lpopAsync(`${userId}newToken`);
        }
    }
}
