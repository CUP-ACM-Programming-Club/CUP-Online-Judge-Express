/**
 * 组装根：problem 领域的端口绑定。由 main/compose.ts 引入。
 */
import { bindPort } from "../../application/ports/registry";
import { lazy } from "./lazy";

void bindPort; void lazy;
