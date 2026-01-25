import "reflect-metadata";
import { expect } from "chai";
import { TokenManagerService } from "../../../../module/account/token/TokenManagerService";
import { RedisService } from "../../../../module/redis/RedisService";

describe("TokenManagerService", function () {
    let mockRedisService: RedisService;
    let service: TokenManagerService;
    let mockClient: any;

    beforeEach(() => {
        mockClient = {
            llenAsync: async () => 0,
            lpopAsync: async () => { },
            rpushAsync: async () => { }
        };
        mockRedisService = {
            client: mockClient
        } as any;
        service = new TokenManagerService(mockRedisService);
    });

    it("should remove tokens", async function () {
        mockClient.llenAsync = async () => 2;
        let lpopCalls = 0;
        mockClient.lpopAsync = async () => { lpopCalls++; };

        await service.removeToken("u1");
        expect(lpopCalls).to.equal(4); // 2 for newToken + 2 for token
    });

    it("should store tokens and trim list", async function () {
        mockClient.rpushAsync = async (key: string, val: string) => {
            expect(key).to.contain("newToken");
            expect(val).to.equal("hash");
            return 1;
        };
        mockClient.llenAsync = async () => 60; // > 50
        let lpopCalls = 0;
        mockClient.lpopAsync = async () => { lpopCalls++; };

        await service.storeToken("u1", "hash");
        const expectedTrim = 60 - 50; // 10
        expect(lpopCalls).to.equal(expectedTrim);
    });

    it("should do nothing if list size is small", async function () {
        mockClient.rpushAsync = async () => 1;
        mockClient.llenAsync = async () => 40; // < 50
        let lpopCalls = 0;
        mockClient.lpopAsync = async () => { lpopCalls++; };

        await service.storeToken("u1", "hash");
        expect(lpopCalls).to.equal(0);
    });

    it("should handle empty token lists", async function () {
        mockClient.llenAsync = async () => 0;
        let lpopCalls = 0;
        mockClient.lpopAsync = async () => { lpopCalls++; };

        await service.removeToken("u1");
        expect(lpopCalls).to.equal(0);
    });
});
