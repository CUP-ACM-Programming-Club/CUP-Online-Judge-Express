import { expect } from "chai";
import { TokenManagerService } from "../../../../application/account/token/TokenManagerService";
import { UserTokenStore } from "../../../../application/ports/UserTokenStore";

describe("TokenManagerService", function () {
    let service: TokenManagerService;
    let mockClient: any;

    beforeEach(() => {
        mockClient = {
            llenAsync: async () => 0,
            lpopAsync: async () => { },
            rpushAsync: async () => { },
            lrangeAsync: async () => [] as string[]
        };
        // 端口的假实现：转发到上面可随用例替换的 mockClient
        const store: UserTokenStore = {
            llen: (key) => mockClient.llenAsync(key),
            lpop: (key) => mockClient.lpopAsync(key),
            rpush: (key, value) => mockClient.rpushAsync(key, value),
            lrangeAll: (key) => mockClient.lrangeAsync(key, 0, -1)
        };
        service = new TokenManagerService(store);
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

    it("should accept token or newToken found in the lists", async function () {
        mockClient.lrangeAsync = async (key: string) => key.endsWith("newToken") ? ["n1"] : ["t1"];
        expect(await service.hasValidToken("u1", "t1", "x")).to.equal(true);
        expect(await service.hasValidToken("u1", "x", "n1")).to.equal(true);
        expect(await service.hasValidToken("u1", "x", "t1")).to.equal(false);
    });

    it("should handle empty token lists", async function () {
        mockClient.llenAsync = async () => 0;
        let lpopCalls = 0;
        mockClient.lpopAsync = async () => { lpopCalls++; };

        await service.removeToken("u1");
        expect(lpopCalls).to.equal(0);
    });
});
