import crypto from "crypto";
import { canSeeContestSensitive } from "../policy/predicates";

/** 只对特权用户（及本人）返回的提交级敏感字段 */
export const SUBMISSION_SENSITIVE_FIELDS = ["ip", "fingerprint", "fingerprintRaw"];

/**
 * Gravatar 所需的邮箱哈希：md5(trim(lowercase(email)))，与前端 vue-gravatar 的算法一致。
 * 空邮箱返回 ""。
 */
export function gravatarEmailHash(email: any): string {
    if (typeof email !== "string" || email.trim().length === 0) {
        return "";
    }
    return crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

export interface RedactOptions {
    /** 请求者是否有权查看所有行的敏感字段 */
    privileged: boolean;
    /** 当前请求者 user_id；本人的行保留原字段 */
    viewerId?: string | null;
    /** 需要移除的字段 */
    fields: string[];
    /** 是否把 email 换成 email_hash（email 字段存在时才处理） */
    hashEmail?: boolean;
}

/**
 * 返回去敏后的新对象，绝不修改入参（入参可能是 mysql_cache / Redis 缓存中的共享对象）。
 * - 若行中有 email 且 hashEmail=true：总是附加 email_hash；
 * - 非特权且不是本人的行：删除 fields 与 email。
 */
export function redactRow<T extends Record<string, any>>(row: T, opts: RedactOptions): T {
    if (!row || typeof row !== "object") {
        return row;
    }
    const copy: Record<string, any> = Object.assign({}, row);
    if (opts.hashEmail && Object.prototype.hasOwnProperty.call(copy, "email")) {
        copy.email_hash = gravatarEmailHash(copy.email);
    }
    const isOwner = !!opts.viewerId && copy.user_id !== undefined && String(copy.user_id) === String(opts.viewerId);
    if (opts.privileged || isOwner) {
        return copy as T;
    }
    for (const field of opts.fields) {
        delete copy[field];
    }
    if (opts.hashEmail) {
        delete copy.email;
    }
    return copy as T;
}

export function redactRows<T extends Record<string, any>>(rows: T[], opts: RedactOptions): T[] {
    if (!Array.isArray(rows)) {
        return rows;
    }
    return rows.map(row => redactRow(row, opts));
}

/**
 * 比赛相关的“可看敏感字段”特权：管理员 / 比赛管理员(contest_manager) / 该比赛出题人(contest_maker["m"+cid])。
 * 助教等其他特权由调用方按现有逻辑追加。
 */
export function isContestSensitivePrivileged(session: any, contestId: any): boolean {
    return canSeeContestSensitive({ session }, contestId);
}
