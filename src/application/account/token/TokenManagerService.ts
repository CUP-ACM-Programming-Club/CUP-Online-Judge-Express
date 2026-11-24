import { UserTokenStore, userTokenStore } from "../../ports/UserTokenStore";

const ListSize = 50;

export class TokenManagerService {
    private _store: UserTokenStore;

    constructor(store: UserTokenStore = userTokenStore) {
        this._store = store;
    }

    async removeToken(userId: string) {
        const client = this._store;
        let size = await client.llen(`${userId}newToken`);
        while (size-- > 0) {
            await client.lpop(`${userId}newToken`);
        }
        size = await client.llen(`${userId}token`);
        while (size-- > 0) {
            await client.lpop(`${userId}token`);
        }
    }

    async storeToken(userId: string, hash: string) {
        const client = this._store;
        await client.rpush(`${userId}newToken`, hash);
        let size = await client.llen(`${userId}newToken`);
        size -= ListSize;
        while (size-- > 0) {
            await client.lpop(`${userId}newToken`);
        }
    }

    /** cookie 里的 token / newToken 是否在该用户的 token 列表中（未登录 session 时的身份校验）。 */
    async hasValidToken(userId: string, token: any, newToken: any) {
        const originalTokenList = await this._store.lrangeAll(`${userId}token`);
        const newTokenList = await this._store.lrangeAll(`${userId}newToken`);
        return originalTokenList.indexOf(token) !== -1 || newTokenList.indexOf(newToken) !== -1;
    }
}
