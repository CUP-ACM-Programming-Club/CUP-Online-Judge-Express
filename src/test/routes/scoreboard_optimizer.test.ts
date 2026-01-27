/**
 * Scoreboard 优化模块单元测试 - 包含纯函数测试
 * 测试两阶段查询逻辑、数据合并和边界情况
 */

const expect = require("chai").expect;

describe("Scoreboard Optimizer Tests - With Pure Functions", function () {
    const ScoreboardService = require("../../service/ScoreboardService").default;

    // Access private methods for testing
    const service: any = ScoreboardService;

    const generateCacheKey = service.generateCacheKey.bind(service);
    const generateClearCacheKeys = service.generateClearCacheKeys.bind(service);
    const extractUserIds = service.extractUserIds.bind(service);
    const createUserMap = service.createUserMap.bind(service);
    const extractSolutionIds = service.extractSolutionIds.bind(service);
    const createSimMap = service.createSimMap.bind(service);
    const mergeSubmissionData = service.mergeSubmissionData.bind(service);
    const submitHandlerOptimized = service.submitHandlerOptimized.bind(service);
    const getScoreboardWithCache = service.getScoreboard.bind(service); // Note: renamed in Service?
    const clearScoreboardCache = service.clearScoreboardCache.bind(service);

    describe("纯函数测试 - generateCacheKey", function () {
        it("should generate admin cache key", function () {
            const key = generateCacheKey(123, true);
            expect(key).to.equal("scoreboard:123:admin");
        });

        it("should generate user cache key", function () {
            const key = generateCacheKey(456, false);
            expect(key).to.equal("scoreboard:456:user");
        });

        it("should handle zero contest ID", function () {
            const key = generateCacheKey(0, true);
            expect(key).to.equal("scoreboard:0:admin");
        });
    });

    describe("纯函数测试 - generateClearCacheKeys", function () {
        it("should generate both admin and user keys", function () {
            const keys = generateClearCacheKeys(789);
            expect(keys).to.deep.equal([
                "scoreboard:789:admin",
                "scoreboard:789:user"
            ]);
        });

        it("should always return exactly 2 keys", function () {
            expect(generateClearCacheKeys(1)).to.have.lengthOf(2);
            expect(generateClearCacheKeys(999999)).to.have.lengthOf(2);
        });
    });

    describe("纯函数测试 - extractUserIds", function () {
        it("should extract unique user IDs", function () {
            const submissions = [
                { user_id: 'user1' },
                { user_id: 'user2' },
                { user_id: 'user1' },
                { user_id: 'user3' }
            ];
            const userIds = extractUserIds(submissions);
            expect(userIds).to.have.lengthOf(3);
            expect(userIds).to.include.members(['user1', 'user2', 'user3']);
        });

        it("should handle empty submissions", function () {
            const userIds = extractUserIds([]);
            expect(userIds).to.deep.equal([]);
        });

        it("should handle single submission", function () {
            const userIds = extractUserIds([{ user_id: 'test' }]);
            expect(userIds).to.deep.equal(['test']);
        });
    });

    describe("纯函数测试 - createUserMap", function () {
        it("should create user ID to user info mapping", function () {
            const users = [
                { user_id: 'user1', nick: 'Nick1', avatar: 'a1.jpg' },
                { user_id: 'user2', nick: 'Nick2', avatar: 'a2.jpg' }
            ];
            const userMap = createUserMap(users);
            expect(userMap['user1']).to.deep.equal(users[0]);
            expect(userMap['user2']).to.deep.equal(users[1]);
        });

        it("should handle empty users array", function () {
            const userMap = createUserMap([]);
            expect(userMap).to.deep.equal({});
        });
    });

    describe("纯函数测试 - extractSolutionIds", function () {
        it("should extract solution IDs with fingerprint", function () {
            const submissions = [
                { solution_id: 1, fingerprint: 'abc' },
                { solution_id: 2, fingerprint: '' },
                { solution_id: 3, fingerprint: 'def' }
            ];
            const ids = extractSolutionIds(submissions);
            expect(ids).to.deep.equal([1, 3]);
        });

        it("should handle all submissions without fingerprint", function () {
            const submissions = [
                { solution_id: 1, fingerprint: '' },
                { solution_id: 2, fingerprint: '' }
            ];
            const ids = extractSolutionIds(submissions);
            expect(ids).to.deep.equal([]);
        });
    });

    describe("纯函数测试 - createSimMap", function () {
        it("should create solution ID to sim mapping", function () {
            const sims = [
                { s_id: 1, sim: 95 },
                { s_id: 2, sim: 88 }
            ];
            const simMap = createSimMap(sims);
            expect(simMap[1]).to.equal(95);
            expect(simMap[2]).to.equal(88);
        });

        it("should handle empty sims array", function () {
            const simMap = createSimMap([]);
            expect(simMap).to.deep.equal({});
        });
    });

    describe("纯函数测试 - mergeSubmissionData", function () {
        it("should merge submission, user and sim data", function () {
            const submissions = [{
                solution_id: 1,
                user_id: 'user1',
                result: 4,
                num: 0,
                fingerprint: 'abc'
            }];
            const userMap = {
                'user1': { nick: 'Test User', avatar: 'avatar.jpg', avatarUrl: 'http://...' }
            };
            const simMap = { 1: 95 };

            const result = mergeSubmissionData(submissions, userMap, simMap);

            expect(result).to.have.lengthOf(1);
            expect(result[0].solution_id).to.equal(1);
            expect(result[0].nick).to.equal('Test User');
            expect(result[0].avatar).to.equal('avatar.jpg');
            expect(result[0].sim).to.equal(95);
        });

        it("should handle missing user data", function () {
            const submissions = [{ user_id: 'missing', solution_id: 1 }];
            const result = mergeSubmissionData(submissions, {}, {});

            expect(result[0].nick).to.be.null;
            expect(result[0].avatar).to.be.null;
        });

        it("should handle missing sim data", function () {
            const submissions = [{ solution_id: 999, user_id: 'user1' }];
            const userMap = { 'user1': { nick: 'Test' } };
            const result = mergeSubmissionData(submissions, userMap, {});

            expect(result[0].sim).to.be.null;
        });
    });

    describe("模块导出验证", function () {
        it("should export all required functions", function () {
            expect(generateCacheKey).to.be.a('function');
            expect(generateClearCacheKeys).to.be.a('function');
            expect(extractUserIds).to.be.a('function');
            expect(createUserMap).to.be.a('function');
            expect(extractSolutionIds).to.be.a('function');
            expect(createSimMap).to.be.a('function');
            expect(mergeSubmissionData).to.be.a('function');
            expect(submitHandlerOptimized).to.be.a('function');
            expect(getScoreboardWithCache).to.be.a('function');
            expect(clearScoreboardCache).to.be.a('function');
        });

        it("should be importable from scoreboard.ts", function () {
            const scoreboardModule = require("../../routes/scoreboard");
            expect(scoreboardModule).to.be.an('array');
            expect(scoreboardModule).to.have.property('clearScoreboardCache');
        });
    });

    describe("边界情况测试", function () {
        it("should handle very large contest ID", function () {
            expect(() => submitHandlerOptimized(999999999, false)).to.not.throw();
        });

        it("should handle zero contest ID", function () {
            expect(() => submitHandlerOptimized(0, false)).to.not.throw();
        });

        it("should handle negative contest ID", function () {
            expect(() => submitHandlerOptimized(-1, false)).to.not.throw();
        });
    });

    describe("返回值类型验证", function () {
        it("submitHandlerOptimized should return a Promise", function () {
            const result = submitHandlerOptimized(9999, false);
            expect(result).to.be.a('promise');
        });

        it("getScoreboardWithCache should return a Promise", function () {
            const result = getScoreboardWithCache(9999, false);
            expect(result).to.be.a('promise');
        });

        it("clearScoreboardCache should return a Promise", function () {
            const result = clearScoreboardCache(9999);
            expect(result).to.be.a('promise');
        });
    });
});
