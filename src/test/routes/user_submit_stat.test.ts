/**
 * User Submit Stat 路由单元测试
 */

const expect = require("chai").expect;

describe("User Submit Stat Tests", function () {
    const module = require("../../routes/user/submit_stat");
    // User 模块使用特殊导出格式: [path, router]
    const [path, router] = module;

    describe("模块导出验证", function () {
        it("should export array with path and router", function () {
            expect(module).to.be.an('array');
            expect(module).to.have.lengthOf(2);
        });

        it("should export correct path", function () {
            expect(path).to.equal('/submit_stat');
        });

        it("should export a router", function () {
            expect(router).to.be.a('function');
            expect(router.name).to.equal('router');
        });
    });

    describe("路由路径验证", function () {
        it("should have GET /:user_id route", function () {
            const routes = router.stack.filter((r: any) => r.route);
            const userIdRoute = routes.find((r: any) => r.route.path === '/:user_id');
            expect(userIdRoute).to.exist;
            expect(userIdRoute.route.methods.get).to.be.true;
        });

        it("should have GET /:user_id/:start_time/:end_time route", function () {
            const routes = router.stack.filter((r: any) => r.route);
            const rangeRoute = routes.find((r: any) => r.route.path === '/:user_id/:start_time/:end_time');
            expect(rangeRoute).to.exist;
            expect(rangeRoute.route.methods.get).to.be.true;
        });

        it("should have exactly 2 routes", function () {
            const routes = router.stack.filter((r: any) => r.route);
            expect(routes).to.have.lengthOf(2);
        });
    });

    describe("路由结构验证", function () {
        it("should only have GET methods", function () {
            const routes = router.stack.filter((r: any) => r.route);
            routes.forEach((route: any) => {
                expect(route.route.methods.get).to.be.true;
                expect(route.route.methods.post).to.be.undefined;
            });
        });

        it("should use async route handlers", function () {
            const routes = router.stack.filter((r: any) => r.route);
            routes.forEach((route: any) => {
                const handler = route.route.stack[0].handle;
                expect(handler.constructor.name).to.equal('AsyncFunction');
            });
        });
    });

    describe("边界情况测试", function () {
        it("should handle router stack access", function () {
            expect(() => router.stack).to.not.throw();
            expect(router.stack).to.be.an('array');
        });

        it("should be usable as Express router", function () {
            expect(router.use).to.be.a('function');
            expect(router.get).to.be.a('function');
        });
    });
});

/**
 * 测试说明：
 * 
 * 覆盖内容：
 * - 特殊导出格式验证 [path, router]
 * - 两个GET路由存在性
 * - 异步处理器验证
 * 
 * 未测试（需集成测试）：
 * - 实际的提交统计查询
 * - 数据聚合逻辑  
 * - 错误处理
 */
