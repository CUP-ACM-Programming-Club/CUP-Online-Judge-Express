/**
 * 图表数据优化模块单元测试
 * 使用 Sinon Mock 依赖以实现 100% 覆盖率
 * 
 * 注意：由于 src/test/setup/mock-external.ts 劫持了 Module._load 并强制返回 mock 对象，
 * 我们必须再次劫持 Module._load 来注入我们的 sinon stubs。
 */

const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");

describe("Graph Data Optimizer Tests (Full Coverage)", function () {
    let queryStub;
    let withCacheStub;
    let clearCacheBatchStub;
    let optimizer;
    let previousLoad;

    const TIME_GRANULARITY = {
        MONTH: 'month',
        DAY: 'day',
        HOUR: 'hour',
        MINUTE: 'minute',
        SECOND: 'second'
    };

    beforeEach(function () {
        // 1. 准备 Mocks
        queryStub = sinon.stub().resolves([]);
        withCacheStub = sinon.stub().callsFake(async (opts, fn) => {
            return await fn();
        });
        clearCacheBatchStub = sinon.stub().resolves();

        // 2. 劫持 Module._load
        // 这是必要的，因为 mock-external.ts 已经劫持了一次并忽略了 require.cache
        previousLoad = Module._load;
        Module._load = function (request, parent, isMain) {
            // 使用 includes 模糊匹配来拦截特定模块
            // 注意：request 可能是相对路径，也可能是模块名
            if (request.includes("mysql_cache")) {
                return queryStub;
            }
            if (request.includes("cache-helper")) {
                return {
                    withCache: withCacheStub,
                    clearCacheBatch: clearCacheBatchStub
                };
            }
            return previousLoad.apply(this, arguments);
        };

        // 3. 清除 optimizer 缓存以触发重新 require
        Object.keys(require.cache).forEach(key => {
            if (key.includes("graph_data_optimizer")) {
                delete require.cache[key];
            }
        });

        // 4. 加载被测模块
        optimizer = require("../../routes/status/graph_data_optimizer");
    });

    afterEach(function () {
        // 恢复之前的 _load (即使它是被 mock-external.ts 劫持过的)
        if (previousLoad) {
            Module._load = previousLoad;
        }
        sinon.restore();
    });

    describe("getGraphDataWithCache", function () {
        it("should call withCache with correct key and ttl", async function () {
            await optimizer.getGraphDataWithCache(1000, TIME_GRANULARITY.MONTH);

            expect(withCacheStub.calledOnce).to.be.true;
            const args = withCacheStub.firstCall.args;
            expect(args[0]).to.have.property('key').that.contains('graph:1000:month');
            expect(args[0]).to.have.property('ttl', 300);
        });

        it("should call withCache with global key when contestId is 0 or undefined", async function () {
            await optimizer.getGraphDataWithCache(0, TIME_GRANULARITY.DAY);

            expect(withCacheStub.calledOnce).to.be.true;
            const args = withCacheStub.firstCall.args;
            expect(args[0]).to.have.property('key').that.contains('graph:global:day');
        });
    });

    describe("getOptimizedGraphData (Internal Logic via withCache)", function () {
        describe("Specific Contest Stats", function () {
            const contestId = 1000;

            it("should generate correct SQL for MONTH granularity", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.MONTH);

                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include("YEAR(in_date) as year, MONTH(in_date) as month");
                expect(sql).to.include("GROUP BY YEAR(in_date), MONTH(in_date)");
                expect(queryStub.firstCall.args[1]).to.deep.equal([contestId, contestId]);
            });

            it("should generate correct SQL for DAY granularity", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.DAY);

                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('DATE_FORMAT(in_date, "%d") as day');
            });

            it("should generate correct SQL for HOUR granularity", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.HOUR);

                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('HOUR(in_date) as hour');
            });

            it("should generate correct SQL for MINUTE granularity", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.MINUTE);

                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('MINUTE(in_date) as minute');
            });

            it("should generate correct SQL for SECOND granularity", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.SECOND);

                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('SECOND(in_date) as second');
            });

            it("should generate default SQL (MONTH) for invalid granularity", async function () {
                await optimizer.getGraphDataWithCache(contestId, "invalid_granularity");

                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include("YEAR(in_date) as year, MONTH(in_date) as month");
            });
        });

        describe("Global Stats", function () {
            const contestId = 0;

            it("should generate correct SQL for MONTH granularity (Global)", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.MONTH);

                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include("FROM solution");
                expect(sql).to.not.include("vjudge_solution");
                expect(sql).to.include("YEAR(in_date) as year, MONTH(in_date) as month");
            });

            it("should generate correct SQL for DAY granularity (Global)", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.DAY);
                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('DATE_FORMAT(in_date, "%d") as day');
            });

            it("should generate correct SQL for HOUR granularity (Global)", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.HOUR);
                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('HOUR(in_date) as hour');
            });

            it("should generate correct SQL for MINUTE granularity (Global)", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.MINUTE);
                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('MINUTE(in_date) as minute');
            });

            it("should generate correct SQL for SECOND granularity (Global)", async function () {
                await optimizer.getGraphDataWithCache(contestId, TIME_GRANULARITY.SECOND);
                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include('SECOND(in_date) as second');
            });

            it("should generate default SQL (MONTH) for invalid granularity (Global)", async function () {
                await optimizer.getGraphDataWithCache(contestId, "invalid");
                expect(queryStub.called).to.be.true;
                const sql = queryStub.firstCall.args[0];
                expect(sql).to.include("YEAR(in_date) as year, MONTH(in_date) as month");
            });
        });
    });

    describe("clearGraphDataCache", function () {
        it("should call clearCacheBatch with all granularity keys", async function () {
            const contestId = 1000;
            await optimizer.clearGraphDataCache(contestId);

            expect(clearCacheBatchStub.calledOnce).to.be.true;
            const keys = clearCacheBatchStub.firstCall.args[0];
            expect(keys).to.be.an('array');
            expect(keys).to.have.lengthOf(5);
            expect(keys).to.include(`graph:${contestId}:month`);
            expect(keys).to.include(`graph:${contestId}:day`);
        });
    });

    describe("indexToGranularity", function () {
        const { indexToGranularity } = require("../../routes/status/graph_data_optimizer");

        it("should handle all valid indices", function () {
            expect(optimizer.indexToGranularity(0)).to.equal(TIME_GRANULARITY.MONTH);
            expect(optimizer.indexToGranularity(1)).to.equal(TIME_GRANULARITY.DAY);
            expect(optimizer.indexToGranularity(2)).to.equal(TIME_GRANULARITY.HOUR);
            expect(optimizer.indexToGranularity(3)).to.equal(TIME_GRANULARITY.MINUTE);
            expect(optimizer.indexToGranularity(4)).to.equal(TIME_GRANULARITY.SECOND);
        });

        it("should return defaults for invalid indices", function () {
            expect(optimizer.indexToGranularity(-1)).to.equal(TIME_GRANULARITY.MONTH);
            expect(optimizer.indexToGranularity(5)).to.equal(TIME_GRANULARITY.MONTH);
            expect(optimizer.indexToGranularity(undefined)).to.equal(TIME_GRANULARITY.MONTH);
        });
    });
});
