import { submissionExportRepository } from "../ports/SubmissionExportRepository";

class ExportService {

    async getRealUserID(nick: string) {
        if (typeof nick !== "string") {
            return undefined;
        }
        const data = await submissionExportRepository.findUserIdsByNick(nick.trim());
        if (!!data && data.length > 0) {
            for (let el of data) {
                if (!isNaN(el.user_id)) {
                    return el.user_id;
                }
            }
            return undefined;
        } else {
            return undefined;
        }
    }

    async getContestCodeSet(contest_id: number | string) {
        const data = await submissionExportRepository.findContestAcceptedCode(contest_id);

        let nickSet = data.map((el: any) => el.nick);
        nickSet = await Promise.all(nickSet.map((el: any) => this.getRealUserID(el)));
        for (let i = 0; i < data.length; ++i) {
            data[i].realUserID = nickSet[i];
        }
        return data;
    }
}

export default new ExportService();
