import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import {Request} from "express";
import {MySQLManager} from "../mysql/MySQLManager";

interface IRawAward {
    userId: string,
    award: string,
    year: number
}

class AwardManager {

    bodyChecker(rawAward: any) {
        if (typeof rawAward === "undefined" || rawAward === null) {
            throw new Error("request body should not be null or undefined");
        }
        if (typeof rawAward.userId !== "string") {
            throw new Error("user id should be string");
        }
        if (typeof rawAward.award !== "string") {
            throw new Error("award should be string");
        }
        if (typeof rawAward.year !== "number") {
            throw new Error("year should be number");
        }
    }

    checkAwardId (rawAwardId: any) {
        if (isNaN(rawAwardId)) {
            throw new Error("award id should be number");
        }
    }

    async addAward(awardDto: IRawAward) {
        return await MySQLManager.execQuery("insert into award(user_id, award, year)values(?,?,?)", [awardDto.userId, awardDto.award,awardDto.year]);
    }

    async updateAward(awardDto: IRawAward, awardId: number) {
        return await MySQLManager.execQuery("update award set user_id=?, award = ?, year = ? where award_id = ?", [awardDto.userId, awardDto.award, awardDto.year, awardId]);
    }

    async deleteAward(awardId: number) {
        return await MySQLManager.execQuery("delete from award where award_id = ?", [awardId]);
    }

    async selectAwardByAwardId(awardId: number) {
        return await MySQLManager.execQuery("select * from award where award_id = ?", [awardId]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async addAwardByRequest(req: Request) {
        const rawAward = req.body;
        this.bodyChecker(rawAward);
        await this.addAward(rawAward as IRawAward);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async updateAwardByAwardIdRequest(req: Request) {
        const awardId = req.params.award_id;
        const rawAward = req.body;
        this.checkAwardId(awardId);
        this.bodyChecker(rawAward);
        await this.updateAward(rawAward as IRawAward, parseInt(awardId));
    }

    @ErrorHandlerFactory(ok.okMaker)
    async deleteAwardByAwardIdRequest(req: Request) {
        const awardId = req.params.award_id;
        this.checkAwardId(awardId);
        await this.deleteAward(parseInt(awardId));
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getAwardByAwardIdRequest(req: Request) {
        const awardId = req.params.award_id;
        this.checkAwardId(awardId);
        return await this.selectAwardByAwardId(parseInt(awardId));
    }
}

export default new AwardManager();
