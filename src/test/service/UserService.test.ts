
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("UserService Tests", function () {
    let UserService: any;
    let queryStub: sinon.SinonStub;
    let cacheQueryStub: sinon.SinonStub;
    let previousLoad: any;

    beforeEach(function () {
        queryStub = sinon.stub().resolves([]);
        cacheQueryStub = sinon.stub().resolves([]);

        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("mysql_cache")) return cacheQueryStub;
            return previousLoad.apply(this, arguments);
        };

        delete require.cache[require.resolve("../../service/UserService")];
        UserService = require("../../service/UserService").default;
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    describe("getUserProfile", () => {
        it("should aggregate user profile data correctly", async () => {
            // Setup mocks for 17 queries (0 to 16)
            // The service pushes promises to an array. We need to check execution order or results.
            // Since it uses `Promise.all(sqlQueue)`, order in array matches push order.

            // 0. Submission stats
            queryStub.onCall(0).resolves([{ oj_name: "LOCAL", problem_id: 1, result: 4 }]);
            // 1. Privilege
            queryStub.onCall(1).resolves([{ rightstr: "administrator" }]);
            // 2. Award
            queryStub.onCall(2).resolves([{ year: 2020, award: "Gold" }]);
            // 3. User Info
            queryStub.onCall(3).resolves([{ nick: "TestUser", school: "CUP" }]);
            // 4. ACM Member
            queryStub.onCall(4).resolves([{ student_id: "2020001" }]);
            // 5. Special Subject
            queryStub.onCall(5).resolves([{ topic_id: 1 }]);
            // 6. Rank
            queryStub.onCall(6).resolves([{ rnk: 5 }]);
            // 7. Login Time
            queryStub.onCall(7).resolves([{ time: "2023-01-01" }]);
            // 8. Articles
            queryStub.onCall(8).resolves([{ title: "Blog 1" }]);
            // 9. Submission Count
            queryStub.onCall(9).resolves([{ cnt: 10, year: 2023, month: 1, day: 1 }]);
            // 10. OS Stats
            queryStub.onCall(10).resolves([{ os_name: "Windows", cnt: 5 }]);
            // 11. Browser Stats
            queryStub.onCall(11).resolves([{ browser_name: "Chrome", cnt: 5 }]);
            // 12. SIM Count
            queryStub.onCall(12).resolves([{ cnt: 2 }]);
            // 13. SIM Average
            queryStub.onCall(13).resolves([{ average: 80 }]);
            // 14. SIM Average Length
            queryStub.onCall(14).resolves([{ average: 500 }]);
            // 15. Total SIM Time (Count)
            queryStub.onCall(15).resolves([{ cnt: 100 }]); // This seems to be sim count again in code?
            // 16. Vjudge Rank
            queryStub.onCall(16).resolves([{ rnk: 10 }]);

            const result = await UserService.getUserProfile("test_user");

            expect(result.information.nick).to.equal("TestUser");
            expect(result.rank).to.equal(5);
            expect(result.vjudge_rank).to.equal(10);
            expect(result.submission[0].oj_name).to.equal("LOCAL");
            expect(result.privilege[0].rightstr).to.equal("administrator");
            expect(result.sim_count).to.equal(2);
        });

        it("should handle empty results gracefully", async () => {
            // All queries resolve to empty lists or nulls where applicable
            // Queries 3, 4, 6, 12-16 usually need at least one row with aggregations or expect access [0]
            // Service code: result[3][0], result[6][0].rnk, result[12][0].cnt etc.
            // If query returns [], accessing [0] throws.
            // But MySQL aggregations like count(1) ALWAYS return 1 row (count=0).
            // Normal selects might return empty.
            // Let's verify standard SQL behavior expectations.

            // 0 (Sub) -> []
            // 1 (Priv) -> []
            // 2 (Award) -> []
            // 3 (Info) -> [] -> Access [0] -> Undefined -> Error?
            // Code: `information: result[3][0]` -> if result[3] is [], this is undefined.

            // Does UserService handle user not found?
            // It assumes user exists presumably (controller checks?).
            // Let's assume Info query returns valid user (mock at least that).

            queryStub.resolves([]); // Default empty
            // Fix critical ones
            queryStub.onCall(3).resolves([{}]); // User Info
            queryStub.onCall(4).resolves([{}]); // ACM Member (nullable?) - Code `result[4][0]` - if empty, undefined.
            queryStub.onCall(6).resolves([{ rnk: 1 }]); // Rank
            queryStub.onCall(12).resolves([{}]); // SIM Count
            queryStub.onCall(13).resolves([{}]);
            queryStub.onCall(14).resolves([{}]);
            queryStub.onCall(15).resolves([{}]);
            queryStub.onCall(16).resolves([{ rnk: 1 }]);

            const result = await UserService.getUserProfile("test_user");
            expect(result.submission).to.deep.equal([]);
        });
    });

    describe("getUserInfoByUserId", () => {
        it("should return user info", async () => {
            cacheQueryStub.resolves([{ user_id: "test", nick: "Nick" }]);
            const result = await UserService.getUserInfoByUserId("test");
            expect(result[0].nick).to.equal("Nick");
        });
    });

    describe("getUserIdBySolutionId", () => {
        it("should return user_id if solution exists", async () => {
            cacheQueryStub.resolves([{ user_id: "found_user" }]);
            const result = await UserService.getUserIdBySolutionId(100);
            expect(result).to.equal("found_user");
        });

        it("should return null if solution not found", async () => {
            cacheQueryStub.resolves([]);
            const result = await UserService.getUserIdBySolutionId(100);
            expect(result).to.be.null;
        });
    });
});
