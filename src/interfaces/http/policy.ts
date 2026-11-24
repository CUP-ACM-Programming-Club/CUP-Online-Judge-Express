/**
 * 权限策略入口：谓词见 ./predicates，中间件见 ./middleware。
 * 被 auth 链（middleware/admin、ban_check、contest_mode）引用时请直接引 ./predicates，避免循环依赖。
 */
export * from "../../domain/policy/predicates";
export * from "./middleware/policy";
