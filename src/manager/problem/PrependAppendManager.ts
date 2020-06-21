import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";

const query = require("../../module/mysql_cache");

interface ICodePayload {
    language: number,
    code: string
}

interface IPrefilePayload {
    problem_id: number,
    prepend: number,
    code: string,
    type: number
}

interface IPrefileDTOPayload {
    payload: ICodePayload[],
    problemId: number | string
}

export class PrependAppendManager {

    private async getCodeByPrependOrAppend(problemId: number | string, prepend: number) {
        const payload: IPrefileDTOPayload = {
            payload: [],
            problemId
        };
        const data = await query(`select problem_id, prepend, code, type from prefile where problem_id = ? and prepend = ?`, [problemId, prepend]);
        if (data && data.length && data.length > 0) {
            data.forEach((e: IPrefilePayload) => {
                payload.payload.push({
                    language: e.type,
                    code: e.code
                });
            });
        }
        return payload;
    }

    private async setCodeByPrependOrAppend(prependCodePayload: IPrefileDTOPayload, prepend: number) {
        const problemId = prependCodePayload.problemId;
        prependCodePayload.payload.forEach(e => {
            query(`insert into prefile(problem_id, prepend, code, type) values (?,?,?,?)`,
                [problemId, prepend, e.code, e.language]);
        });
    }

    private async deleteCodeByPrependOrAppend(prependCodePayload: IPrefileDTOPayload, prepend: number) {
        const problemId = prependCodePayload.problemId;
        await query(`delete from prefile where problem_id = ? and prepend = ?`, [problemId, prepend]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getPrependCode(problemId: number | string) {
        return await this.getCodeByPrependOrAppend(problemId, 1);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getAppendCode(problemId: number | string) {
        return await this.getCodeByPrependOrAppend(problemId, 0);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setPrependCode(prependAppendPayload: IPrefileDTOPayload) {
        await this.deleteCodeByPrependOrAppend(prependAppendPayload, 1);
        return await this.setCodeByPrependOrAppend(prependAppendPayload, 1);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setAppendCode(prependAppendPayload: IPrefileDTOPayload) {
        await this.deleteCodeByPrependOrAppend(prependAppendPayload, 0);
        return await this.setCodeByPrependOrAppend(prependAppendPayload, 0);
    }
}

export default new PrependAppendManager();
