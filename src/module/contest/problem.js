const cache_query = require("../mysql_cache");

module.exports = function (cid, vjudge) {
	if (vjudge) {
		return cache_query(`select * from (SELECT \`problem\`.\`title\` as \`title\`,\`problem\`.\`problem_id\` as \`pid\`,source as source,"LOCAL" as oj_name,contest_problem.num as pnum

		FROM \`contest_problem\`,\`problem\`

		WHERE \`contest_problem\`.\`problem_id\`=\`problem\`.\`problem_id\` 

		AND \`contest_problem\`.\`contest_id\`= ? AND \`contest_problem\`.\`oj_name\` IS NULL ORDER BY \`contest_problem\`.\`num\` 
                ) problem
                left join (select problem_id pid1,num,count(1) accepted from solution where result=4 and contest_id= ? group by pid1) p1 on problem.pid=p1.pid1
                left join (select problem_id pid2,num,count(1) submit from solution where contest_id= ?  group by pid2) p2 on problem.pid=p2.pid2
union all
select * from (SELECT \`vjudge_problem\`.\`title\` as \`title\`,\`vjudge_problem\`.\`problem_id\` as \`pid\`,"" as source,source as oj_name,contest_problem.num as pnum FROM
 \`contest_problem\`,\`vjudge_problem\`
WHERE \`contest_problem\`.\`problem_id\`=\`vjudge_problem\`.\`problem_id\`
AND \`contest_problem\`.\`contest_id\`= ? AND \`contest_problem\`.\`oj_name\`=\`vjudge_problem\`.\`source\` ORDER BY \`contest_problem\`.\`num\`) vproblem
left join(select problem_id pid1,num,count(1) accepted from vjudge_solution where result=4 and contest_id= ? group by num) vp1 on vproblem.pid=vp1.pid1 and vproblem.pnum=vp1.num
left join(select problem_id pid2,num,count(1) submit from vjudge_solution where contest_id= ? group by num) vp2 on vproblem.pid=vp2.pid2 and vproblem.pnum=vp2.num
order by pnum;`, [cid, cid, cid, cid, cid, cid]);

	} else {
		return cache_query(`select *
from (SELECT
        \`problem\`.\`title\`      as \`title\`,
        \`problem\`.\`problem_id\` as \`pid\`,
        source                 as source,
        contest_problem.num    as pnum

      FROM \`contest_problem\`, \`problem\`

      WHERE \`contest_problem\`.\`problem_id\` = \`problem\`.\`problem_id\`

            AND \`contest_problem\`.\`contest_id\` = ? AND \`contest_problem\`.\`oj_name\` IS NULL
      ORDER BY \`contest_problem\`.\`num\`
     ) problem
  left join (select
               problem_id pid1,
               num,
               count(1)   accepted
             from solution
             where result = 4 and contest_id = ?
             group by pid1) p1 on problem.pid = p1.pid1
  left join (select
               problem_id pid2,
               num,
               count(1)   submit
             from solution
             where contest_id = ?
             group by pid2) p2 on problem.pid = p2.pid2
union all
select *
from (SELECT
        \`vjudge_problem\`.\`title\`      as \`title\`,
        \`vjudge_problem\`.\`problem_id\` as \`pid\`,
        source                        as source,
        contest_problem.num           as pnum
      FROM
        \`contest_problem\`, \`vjudge_problem\`
      WHERE \`contest_problem\`.\`problem_id\` = \`vjudge_problem\`.\`problem_id\`
            AND \`contest_problem\`.\`contest_id\` = ? AND \`contest_problem\`.\`oj_name\` = \`vjudge_problem\`.\`source\`
      ORDER BY \`contest_problem\`.\`num\`) vproblem
  left join (select
               problem_id pid1,
               num,
               count(1)   accepted
             from vjudge_solution
             where result = 4 and contest_id = ?
             group by num) vp1 on vproblem.pid = vp1.pid1 and vproblem.pnum = vp1.num
  left join (select
               problem_id pid2,
               num,
               count(1)   submit
             from vjudge_solution
             where contest_id = ?
             group by num) vp2 on vproblem.pid = vp2.pid2 and vproblem.pnum = vp2.num
order by pnum;`, [cid, cid, cid, cid, cid, cid]);
	}
};