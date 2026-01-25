/**
 * Device 路由单元测试
 * 测试设备信息查询接口
 */

const expect = require("chai").expect;

describe("Status Device Tests", function () {
    const router = require("../../routes/status/device");

    describe("路由导出验证", function () {
        it("should export a router", function () {
            expect(router).to.be.a('function');
            expect(router.name).to.equal('router');
        });

        it("should have GET /os route", function () {
            const routes = router.stack.filter((r: any) => r.route);
            const osRoute = routes.find((r: any) => r.route.path === '/os');
            expect(osRoute).to.exist;
            expect(osRoute.route.methods.get).to.be.true;
        });

        it("should have GET /browser route", function () {
            const routes = router.stack.filter((r: any) => r.route);
            const browserRoute = routes.find((r: any) => r.route.path === '/browser');
            expect(browserRoute).to.exist;
            expect(browserRoute.route.methods.get).to.be.true;
        });

        it("should have GET /all route", function () {
            const routes = router.stack.filter((r: any) => r.route);
            const allRoute = routes.find((r: any) => r.route.path === '/all');
            expect(allRoute).to.exist;
            expect(allRoute.route.methods.get).to.be.true;
        });
    });

    describe("路由路径验证", function () {
        it("should have exactly 3 routes", function () {
            const routes = router.stack.filter((r: any) => r.route);
            expect(routes).to.have.lengthOf(3);
        });

        it("should have correct route paths", function () {
            const routes = router.stack.filter((r: any) => r.route);
            const paths = routes.map((r: any) => r.route.path);

            expect(paths).to.include('/os');
            expect(paths).to.include('/browser');
            expect(paths).to.include('/all');
        });

        it("should only have GET methods", function () {
            const routes = router.stack.filter((r: any) => r.route);

            routes.forEach((route: any) => {
                expect(route.route.methods.get).to.be.true;
                expect(route.route.methods.post).to.be.undefined;
                expect(route.route.methods.put).to.be.undefined;
                expect(route.route.methods.delete).to.be.undefined;
            });
        });
    });

    describe("模块结构验证", function () {
        it("should be importable from status.ts", function () {
            const statusModule = require("../../routes/status");
            expect(statusModule).to.be.an('array');
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

        it("should have valid route structure", function () {
            const routes = router.stack.filter((r: any) => r.route);

            routes.forEach((route: any) => {
                expect(route).to.have.property('route');
                expect(route.route).to.have.property('path');
                expect(route.route).to.have.property('methods');
                expect(route.route).to.have.property('stack');
            });
        });
    });
});

/**
 * 测试说明：
 * 
 * 本测试覆盖：
 * - 路由导出和结构
 * - 路由路径和HTTP方法
 * - 异步处理器验证
 * 
 * 未测试内容（需要集成测试）：
 * - 实际的数据库查询
 * - 错误处理逻辑
 * - 响应数据格式
 * 
 * 这些部分建议通过 API 集成测试覆盖。
 */
