import cache_query = require("../module/mysql_cache");

class TutorialService {

    private async checkHandler(id: any, userId: string, table_name: string) {
        const _data = await cache_query(`select user_id from ${table_name} where ${table_name}_id = ?`, [id]);
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
        const _data = await cache_query(`select result,problem_id${!local ? ",oj_name" : ""} from ${!local ? "vjudge_" : ""}solution where 
	    solution_id = ?`, [solution_id]);
        return _data.length > 0 && parseInt(_data[0].result) === 4 && parseInt(problem_id) === parseInt(_data[0].problem_id) && (!_data[0].oj_name || source === _data[0].oj_name);
    }

    async checkOwner(solution_id: any, userId: string) {
        return await this.checkHandler(solution_id, userId, "solution");
    }

    async checkTutorialOwner(tutorial_id: any, userId: string) {
        return await this.checkHandler(tutorial_id, userId, "tutorial");
    }

    async getSourceProblemId(tutorial_id: any) {
        const _data = await cache_query("select source,problem_id from tutorial where tutorial_id = ?", [tutorial_id]);
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
        sqlQuery.push(cache_query(`select tutorial.*,users.user_id,users.nick,users.avatar,users.avatarUrl,users.solved,users.biography,
	users.email,
	 solution.time,solution.memory,solution.language,solution.result,solution.code_length,solution.in_date,source_code_user.source as code
	from tutorial
left join users on users.user_id = tutorial.user_id
left join solution on solution.solution_id = tutorial.solution_id
left join source_code_user on source_code_user.solution_id = tutorial.solution_id 
where tutorial.source = ? and tutorial.problem_id = ? order by 'like' desc, dislike asc,tutorial.in_date desc`, [source, id]));
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
        let sql = "select solution_id,content,tutorial_id,user_id,in_date,problem_id,source from tutorial ";
        let sqlArr = [];
        if (tutorial_id) {
            sql += " where tutorial_id = ?";
            sqlArr.push(tutorial_id);
        } else {
            sql += " order by tutorial_id desc";
        }
        return await cache_query(sql, sqlArr);
    }

    async createTutorial(source: string, problem_id: string, userId: string, solution_id: string, content: string) {
        return await cache_query(`insert into tutorial(source,problem_id,user_id,solution_id,content)
        values(?,?,?,?,?)`,
            [source, problem_id, userId, solution_id, content]);
    }

    async updateTutorial(content: string, solution_id: string, tutorial_id: string) {
        return await cache_query(`update tutorial set content = ?,
        solution_id = ? where tutorial_id = ?`, [content, solution_id, tutorial_id]);
    }
}

export default new TutorialService();
