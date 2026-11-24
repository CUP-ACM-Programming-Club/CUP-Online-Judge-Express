import { SubmissionLoginTokens } from "../../../application/ports/SubmissionSubmitRepository";

const client = require("../../redis/redis").default;

export class RedisSubmissionLoginTokens implements SubmissionLoginTokens {
    listTokens(user_id: string) {
        return client.lrangeAsync(`${user_id}token`, 0, -1);
    }
}
