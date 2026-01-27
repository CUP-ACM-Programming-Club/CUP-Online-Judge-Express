/**
 * ProblemStatus 优化模块单元测试 - 包含纯函数测试
 * 测试合并查询逻辑、统计提取和边界情况
 */

const expect = require("chai").expect;

describe("ProblemStatus Optimizer Tests - With Pure Functions", function () {
    const ProblemStatusService = require("../../service/ProblemStatusService").default;

    // Access private methods for testing
    const service: any = ProblemStatusService;

    const generateProblemStatusCacheKey = service.generateProblemStatusCacheKey.bind(service);
    const generateProblemStatusClearKeys = service.generateProblemStatusClearKeys.bind(service);
    const extractStats = service.extractStats.bind(service);
    const getProblemStatusOptimized = service.getProblemStatusOptimized.bind(service);
    const getProblemStatusWithCache = service.getProblemStatusWithCache.bind(service);
    const clearProblemStatusCache = service.clearProblemStatusCache.bind(service);

    describe("纯函数测试 - generateProblemStatusCacheKey", function () {
        it("should generate cache key for local source", function () {
            const key = generateProblemStatusCacheKey(1001, true, '', 0);
            expect(key).to.equal("problemstatus:1001:local:0");
        });

        it("should generate cache key for vjudge source", function () {
            const key = generateProblemStatusCacheKey(1001, false, 'POJ', 2);
            expect(key).to.equal("problemstatus:1001:POJ:2");
        });

        it("should handle different page numbers", function () {
            expect(generateProblemStatusCacheKey(100, true, '', 0)).to.include(':0');
            expect(generateProblemStatusCacheKey(100, true, '', 5)).to.include(':5');
            expect(generateProblemStatusCacheKey(100, true, '', 99)).to.include(':99');
        });
    });

    describe("纯函数测试 - generateProblemStatusClearKeys", function () {
        it("should generate 10 keys by default", function () {
            const keys = generateProblemStatusClearKeys(1001);
            expect(keys).to.have.lengthOf(10);
        });

        it("should generate keys for pages 0-9", function () {
            const keys = generateProblemStatusClearKeys(1001);
            expect(keys[0]).to.equal("problemstatus:1001:local:0");
            expect(keys[9]).to.equal("problemstatus:1001:local:9");
        });

        it("should support custom max pages", function () {
            const keys = generateProblemStatusClearKeys(1001, 5);
            expect(keys).to.have.lengthOf(5);
        });

        it("should handle maxPages = 1", function () {
            const keys = generateProblemStatusClearKeys(1001, 1);
            expect(keys).to.deep.equal(["problemstatus:1001:local:0"]);
        });
    });

    describe("纯函数测试 - extractStats", function () {
        it("should extract stats from merged results", function () {
            const mergedStats = [{
                result: 4,
                count: 10,
                distinct_users: 5,
                user_submit_count: 2,
                total_all: 20,
                total_distinct_users: 8
            }];

            const stats = extractStats(mergedStats);
            expect(stats.total_submit).to.equal(20);
            expect(stats.total_solved_submit).to.equal(8);
            expect(stats.total_solved_user).to.equal(5);
            expect(stats.user_passed).to.equal(2);
            expect(stats.problem_status).to.have.lengthOf(1);
            expect(stats.problem_status[0]).to.deep.equal({ result: 4, total: 10 });
        });

        it("should handle empty stats array", function () {
            const stats = extractStats([]);
            expect(stats.total_submit).to.equal(0);
            expect(stats.total_solved_submit).to.equal(0);
            expect(stats.total_solved_user).to.equal(0);
            expect(stats.user_passed).to.equal(0);
            expect(stats.problem_status).to.deep.equal([]);
        });

        it("should handle multiple result types", function () {
            const mergedStats = [
                { result: 4, count: 10, distinct_users: 5, user_submit_count: 1, total_all: 30, total_distinct_users: 10 },
                { result: 6, count: 5, distinct_users: 3, user_submit_count: 0, total_all: 30, total_distinct_users: 10 },
                { result: 11, count: 15, distinct_users: 8, user_submit_count: 2, total_all: 30, total_distinct_users: 10 }
            ];

            const stats = extractStats(mergedStats);
            expect(stats.total_submit).to.equal(30);
            expect(stats.total_solved_user).to.equal(5); // From result=4
            expect(stats.user_passed).to.equal(1); // From result=4
            expect(stats.problem_status).to.have.lengthOf(3);
        });

        it("should handle stats without result=4", function () {
            const mergedStats = [
                { result: 6, count: 5, distinct_users: 3, user_submit_count: 0, total_all: 5, total_distinct_users: 3 }
            ];

            const stats = extractStats(mergedStats);
            expect(stats.total_solved_user).to.equal(0);
            expect(stats.user_passed).to.equal(0);
        });

        it("should use first element for total counts", function () {
            const mergedStats = [
                { result: 4, count: 1, distinct_users: 1, user_submit_count: 1, total_all: 100, total_distinct_users: 50 },
                { result: 6, count: 2, distinct_users: 2, user_submit_count: 0, total_all: 200, total_distinct_users: 60 }
            ];

            const stats = extractStats(mergedStats);
            expect(stats.total_submit).to.equal(100); // From first element
            expect(stats.total_solved_submit).to.equal(50); // From first element
        });
    });

    describe("模块导出验证", function () {
        it("should export all required functions", function () {
            expect(generateProblemStatusCacheKey).to.be.a('function');
            expect(generateProblemStatusClearKeys).to.be.a('function');
            expect(extractStats).to.be.a('function');
            expect(getProblemStatusOptimized).to.be.a('function');
            expect(getProblemStatusWithCache).to.be.a('function');
            expect(clearProblemStatusCache).to.be.a('function');
        });

        it("should be importable from problemstatus.ts", function () {
            const problemstatusModule = require("../../routes/problemstatus");
            expect(problemstatusModule).to.be.an('array');
            expect(problemstatusModule).to.have.property('clearProblemStatusCache');
        });
    });

    describe("边界情况测试", function () {
        it("should handle very large problem ID", function () {
            expect(() => getProblemStatusOptimized(999999, 'user', 0, 20, true, '')).to.not.throw();
        });

        it("should handle zero problem ID", function () {
            expect(() => getProblemStatusOptimized(0, 'user', 0, 20, true, '')).to.not.throw();
        });

        it("should handle empty user ID", function () {
            expect(() => getProblemStatusOptimized(1001, '', 0, 20, true, '')).to.not.throw();
        });

        it("should handle different sources", function () {
            expect(() => getProblemStatusOptimized(1001, 'user', 0, 20, true, '')).to.not.throw();
            expect(() => getProblemStatusOptimized(1001, 'user', 0, 20, false, 'POJ')).to.not.throw();
        });
    });

    describe("返回值类型验证", function () {
        it("getProblemStatusOptimized should return a Promise", function () {
            const result = getProblemStatusOptimized(1001, 'user', 0, 20, true, '');
            expect(result).to.be.a('promise');
        });

        it("getProblemStatusWithCache should return a Promise", function () {
            const result = getProblemStatusWithCache(1001, 'user', 0, 20, true, '');
            expect(result).to.be.a('promise');
        });

        it("clearProblemStatusCache should return a Promise", function () {
            const result = clearProblemStatusCache(1001);
            expect(result).to.be.a('promise');
        });
    });
});
