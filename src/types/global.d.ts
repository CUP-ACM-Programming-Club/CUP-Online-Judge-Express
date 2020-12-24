import {Express} from "express";
export interface JudgerConfig {
    oj_home: string,
    oj_judge_num: number,
    address: string
}

export interface WebSocketConfig {
    websocket_client_port: number
    judger_port: number;
}

export interface ProblemUploadDestConfig {
    dir: string
}

export interface MySQLConfig {
    host: string,
    user: string,
    password: string,
    port: string | number,
    database: string
}

export interface WebSiteConfig {
    dir: string;
}

export interface EtcConfig {
    compile_arguments: string
}

export interface RedisConfig {
    host: string,
    port: number
}

export interface WebhookConfig {
    secret: string
}

export interface RPCConfig {
    protocol: string,
    host: string,
    port: number
}

export interface CookieConfig {
    path?: string,
    domain?: string,
    httpOnly?: boolean,
    maxAge?: number
}

export interface Config {
    mysql: MySQLConfig,
    judger: JudgerConfig,
    ws: WebSocketConfig,
    salt: string,
    problem_upload_dest: ProblemUploadDestConfig,
    website: WebSiteConfig,
    etc: EtcConfig,
    session_secret: string,
    redis: RedisConfig,
    webhook: WebhookConfig
    init: boolean,
    rpc: RPCConfig,
    cookie: CookieConfig
}

declare global {
    namespace NodeJS {
        interface Global {
            config: Config
            Application: Express,
            clusterMode?: boolean
        }
    }
}
