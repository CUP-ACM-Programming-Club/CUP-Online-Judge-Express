# 服务端架构（Clean Architecture）

## 分层与依赖方向

```
            ┌──────────── main（bin/、app.ts、main/）组装根 ────────────┐
            │                                                          │
   interfaces（HTTP 路由/控制器/中间件、WebSocket）     infrastructure（MySQL、ORM、Redis、缓存、文件、判题机客户端、配置、日志）
            │                                                          │
            └──────────────▶ application（用例 + ports 端口接口） ◀────┘
                                        │
                                        ▼
                         domain（常量、枚举、错误、权限谓词、隐私规则）

   shared：无 I/O、无业务含义的通用工具（锁、内存缓存、装饰器），任何层都能用
```

| 层 | 可以依赖 | 不可以依赖 |
|---|---|---|
| domain | domain、shared | 其他所有层 |
| application | application、domain、shared | infrastructure、interfaces、main |
| infrastructure | infrastructure、`application/ports/*`、domain、shared | interfaces、main、application 中的用例实现 |
| interfaces | interfaces、application、domain、shared | infrastructure、main |
| main | 所有层 | — |

`src/test/architecture/dependency-rule.test.ts` 会扫描所有 import 并强制执行上表。
现存的违规记在 `src/test/architecture/baseline.json`，**只能减少不能增加**：
修掉一条就要从 baseline 里删掉（重新生成：
`TS_NODE_TRANSPILE_ONLY=1 node -r ts-node/register src/test/architecture/scan.ts --write-baseline`）。

## 端口（ports）

application 用 `definePort` 声明需要的能力，`main/compose.ts` 在启动时绑定实现：

```ts
// application/ports/AwardRepository.ts
export interface AwardRepository { findById(id: number): Promise<any[]>; /* … */ }
export const awardRepository = definePort<AwardRepository>("AwardRepository");

// infrastructure/persistence/award/MySqlAwardRepository.ts
export class MySqlAwardRepository implements AwardRepository { /* SQL 都在这里 */ }

// main/compose.ts
bindPort(awardRepository, lazy(() => new MySqlAwardRepository()));
```

- 端口对象是代理，调用时才解析实现，所以模块加载顺序无关。
- 测试里用 `bindPort(port, fake)` 换成内存实现，结束后用 `boundImpl` 取回原实现恢复。
  示例见 `src/test/application/AwardUseCases.test.ts`。
- 已有的跨领域端口：`ports/Logger`（`getLogger(category, level)`）、`ports/Config`（`ConfigManager`：配置与功能开关）。

## 一个功能的标准拆法（以获奖记录为例）

| 文件 | 职责 |
|---|---|
| `application/ports/AwardRepository.ts` | 仓储接口 + 端口 |
| `application/award/AwardUseCases.ts` | 校验、业务规则；只调端口 |
| `infrastructure/persistence/award/MySqlAwardRepository.ts` | 全部 SQL |
| `interfaces/http/controllers/AwardController.ts` | 从 `req` 取参数，调用例，用 `ErrorHandlerFactory(ok.okMaker)` 包成 `{status, data/statement}` |
| `interfaces/http/routes/admin/award/*.ts` | 只做路由绑定 |

规则：
- **SQL 只出现在 infrastructure。** application 里不出现 `query(` / `MySQLManager` / ORM 模型。
- **express 的 `Request` / `Response` 只出现在 interfaces。** 用例的参数是普通值。
- 返回给前端的数据结构和报错文案保持不变（前端依赖它们）。
- 新代码不要再用 `infrastructure/db/legacy/*` 兼容外壳，仓储实现里直接用 `infrastructure/db`（`query` / `cachedQuery` / `tx`）或 `MySQLManager`。
