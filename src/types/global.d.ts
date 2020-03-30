
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

export interface Config {
    mysql: MySQLConfig,
    judger: JudgerConfig,
    ws: WebSocketConfig,
    salt: string,
    problem_upload_dest: ProblemUploadDestConfig,
    website: WebSiteConfig,
    etc: EtcConfig,
    session_secret: string,
    redis: RedisConfig
}

declare global {
    namespace NodeJS {
        interface Global {
            config: Config
        }
    }
}
