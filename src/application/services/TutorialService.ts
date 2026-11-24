import { tutorialRepository } from "../ports/TutorialRepository";

class TutorialService {

    private async checkHandler(id: any, userId: string, table_name: string) {
        const _data = await tutorialRepository.findOwnerRows(table_name, id);
        if (!_data || _data.length <= 0) {
            return false;
        }
        const owner_id = _data[0].user_id;
        return owner_id === userId;
    }

    async checkSolutionId(solution_id: any, problem_id: any, local = true, source = "") {
        solution_id = parseInt(solution_id);
        if (isNaN(solution_id)) {
            return false;
        }
        const _data = await tutorialRepository.findSolutionResult(solution_id, local);
        return _data.length > 0 && parseInt(_data[0].result) === 4 && parseInt(problem_id) === parseInt(_data[0].problem_id) && (!_data[0].oj_name || source === _data[0].oj_name);
    }

    async checkOwner(solution_id: any, userId: string) {
        return await this.checkHandler(solution_id, userId, "solution");
    }

    async checkTutorialOwner(tutorial_id: any, userId: string) {
        return await this.checkHandler(tutorial_id, userId, "tutorial");
    }

    async getSourceProblemId(tutorial_id: any) {
        const _data = await tutorialRepository.findSourceProblemId(tutorial_id);
        if (_data && _data.length > 0) {
            return {
                source: _data[0].source,
                problem_id: _data[0].problem_id
            };
        } else {
            throw new Error("wrong tutorial_id");
        }
    }

    async getTutorialList(source: string, id: string, userId: string) {
        let sqlQuery = [];
        sqlQuery.push(tutorialRepository.findTutorialList(source, id));
        let data = await Promise.all(sqlQuery);
        let result = data[0];
        if (result && result.length > 0) {
            for (let i of result) {
                if (i.user_id === userId) {
                    i.owner = true;
                }
            }
        }
        return result;
    }

    async getTutorial(tutorial_id?: string) {
        return await tutorialRepository.findTutorials(tutorial_id);
    }

    async createTutorial(source: string, problem_id: string, userId: string, solution_id: string, content: string) {
        return await tutorialRepository.insertTutorial(source, problem_id, userId, solution_id, content);
    }

    async updateTutorial(content: string, solution_id: string, tutorial_id: string) {
        return await tutorialRepository.updateTutorial(content, solution_id, tutorial_id);
    }

    /** 某用户写过的题解列表 */
    async getTutorialListByUserId(userId: string) {
        return await tutorialRepository.findTutorialListByUserId(userId);
    }
}

export default new TutorialService();
