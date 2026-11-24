/**
 * 题解 SQL（从 application/services/TutorialService 与原 TutorialManager 逐字搬来）。
 * 注意 insert/update 也走 mysql_cache 外壳——与旧实现一致（外壳会识别写语句不缓存）。
 */
import cache_query = require("../../db/legacy/mysql_cache");
import Cacheable from "../../../shared/cache/Cacheable";
import CachePool from "../../../shared/cache/CachePool";
import { TutorialListItem, TutorialRepository } from "../../../application/ports/TutorialRepository";

export class MySqlTutorialRepository implements TutorialRepository {
    findOwnerRows(table_name: string, id: any) {
        return cache_query(`select user_id from ${table_name} where ${table_name}_id = ?`, [id]);
    }

    findSolutionResult(solution_id: number, local: boolean) {
        return cache_query(`select result,problem_id${!local ? ",oj_name" : ""} from ${!local ? "vjudge_" : ""}solution where 
	    solution_id = ?`, [solution_id]);
    }

    findSourceProblemId(tutorial_id: any) {
        return cache_query("select source,problem_id from tutorial where tutorial_id = ?", [tutorial_id]);
    }

    findTutorialList(source: string, id: string) {
        return cache_query(`select tutorial.*,users.user_id,users.nick,users.avatar,users.avatarUrl,users.solved,users.biography,
	users.email,
	 solution.time,solution.memory,solution.language,solution.result,solution.code_length,solution.in_date,source_code_user.source as code
	from tutorial
left join users on users.user_id = tutorial.user_id
left join solution on solution.solution_id = tutorial.solution_id
left join source_code_user on source_code_user.solution_id = tutorial.solution_id 
where tutorial.source = ? and tutorial.problem_id = ? order by 'like' desc, dislike asc,tutorial.in_date desc`, [source, id]);
    }

    findTutorials(tutorial_id?: string) {
        let sql = "select solution_id,content,tutorial_id,user_id,in_date,problem_id,source from tutorial ";
        let sqlArr = [];
        if (tutorial_id) {
            sql += " where tutorial_id = ?";
            sqlArr.push(tutorial_id);
        } else {
            sql += " order by tutorial_id desc";
        }
        return cache_query(sql, sqlArr);
    }

    insertTutorial(source: string, problem_id: string, userId: string, solution_id: string, content: string) {
        return cache_query(`insert into tutorial(source,problem_id,user_id,solution_id,content)
        values(?,?,?,?,?)`,
            [source, problem_id, userId, solution_id, content]);
    }

    updateTutorial(content: string, solution_id: string, tutorial_id: string) {
        return cache_query(`update tutorial set content = ?,
        solution_id = ? where tutorial_id = ?`, [content, solution_id, tutorial_id]);
    }

    @Cacheable(new CachePool(), 1, "minute")
    findTutorialListByUserId(userId: string): Promise<TutorialListItem[]> {
        return cache_query(`select tutorial_id, tutorial.problem_id as problem_id, problem.title as title from tutorial left join problem on problem.problem_id = tutorial.problem_id where user_id = ?`, [userId]);
    }
}
