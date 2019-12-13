import Lock from "../../decorator/Lock";
import SingleLock from "../../module/common/Lock";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";

const cache_query = require("../../module/mysql_cache");

export class SolveMapManager {
    async getUserList() {
        return await cache_query("select user_id from users");
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Lock(new SingleLock())
    @Cacheable(new CachePool(), 1, "hour")
    async getTotalACList() {
        const userList = await this.getUserList();
        return await Promise.all(userList.map((userArray: any) => this.getUserACListByUserId(userArray.user_id)));
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getUserListForRouter() {
        return await this.getUserList();
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getUserACList(userId: string) {
        return await this.getUserACListByUserId(userId);
    }

    @Lock(new SingleLock())
    @Cacheable(new CachePool(), 30, "minute")
    async getUserACListByUserId(user_id = "") {
        if (user_id === "") {
            return [];
        }
        return await query("select problem_id from solution where user_id = ? and result = 4 order by in_date asc", [user_id]);
    }

    async formatAcceptProblemToEdges(problem_list: any = [], problem_id: any) {
        let specific_problem = false;
        if (!isNaN(problem_id)) {
            specific_problem = true;
            problem_id = parseInt(problem_id);
        }
        const length = problem_list.length;
        let result = [];
        for (let i = 1; i < length; ++i) {
            let prev_problem_id = parseInt(problem_list[i - 1].problem_id);
            let current_problem_id = parseInt(problem_list[i].problem_id);
            if (prev_problem_id !== current_problem_id) {
                if (!specific_problem || (specific_problem && (prev_problem_id === problem_id || current_problem_id === problem_id))) {
                    result.push({from: problem_list[i - 1].problem_id, to: problem_list[i].problem_id});
                }
            }
        }
        return result;
    }

    mergeSameEdges(Edges = []) {
        let map: any = {};
        Edges.forEach((el: any) => {
            map[el.from + " to " + el.to] = Object.assign({value: 0}, el);
        });
        Edges.forEach((el: any) => {
            ++map[el.from + " to " + el.to].value;
        });
        return Object.values(map);
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Lock(new SingleLock())
    @Cacheable(new CachePool(), 1, "day")
    async getSolveMap(problem_id?: number | string) {
        const userList = await this.getUserList();
        const ACLists = await Promise.all(userList.map((user: any) => this.getUserACListByUserId(user.user_id)));
        const formattedEdges = await Promise.all(ACLists.map(list => this.formatAcceptProblemToEdges(list, problem_id)));
        const edges: any = [];
        formattedEdges.forEach(edgeList => edges.push(...edgeList));
        return this.mergeSameEdges(edges);
    }
}

export default new SolveMapManager();
