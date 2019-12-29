import Lock from "../../decorator/Lock";
import SingleLock from "../../module/common/Lock";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import _ from "lodash";
import isNumber from "../../module/util/isNumber";

const cache_query = require("../../module/mysql_cache");

export class SolveMapManager {
    async getUserList() {
        return await cache_query("select user_id from users where solved > 0");
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Lock(new SingleLock())
    @Cacheable(new CachePool(), 1, "hour")
    async getTotalACList() {
        const userList = await this.getUserList();
        return await Promise.all(userList.map((userArray: any) => this.getUserACListByUserId(userArray.user_id)));
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Cacheable(new CachePool(), 1, "hour")
    async getUserListForRouter() {
        return await this.getUserList();
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Cacheable(new CachePool(), 30, "minute")
    async getUserACList(userId: string) {
        return await this.getUserACListByUserId(userId);
    }

    @Lock(new SingleLock())
    @Cacheable(new CachePool(), 30, "minute")
    async getUserACListByUserId(user_id = "") {
        if (user_id === "") {
            return [];
        }
        return await cache_query("select problem_id from solution where user_id = ? and result = 4 group by problem_id, in_date order by in_date asc", [user_id]);
    }

    async formatAcceptProblemToEdges(problem_list: any = [], problem_id: any) {
        let specific_problem = false;
        if (isNumber(problem_id)) {
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
            const key = el.from + " to " + el.to;
            map[key] = Object.assign({value: 0}, el);
            ++map[key].value;
        });
        return Object.values(map);
    }

    @ErrorHandlerFactory(ok.okMaker)
    @Lock(new SingleLock())
    @Cacheable(new CachePool(), 1, "day")
    async getSolveMap(problem_id?: number | string) {
        const userList = await this.getUserList();
        let ACLists: any[] = await Promise.all(userList.map((user: any) => this.getUserACListByUserId(user.user_id)));
        ACLists = _.filter(ACLists, (e: any) => Array.isArray(e) && e.length > 0);
        const formattedEdges: any[] = await Promise.all(ACLists.map(list => this.formatAcceptProblemToEdges(list, problem_id)));
        const edges: any = _.flatten(formattedEdges);
        return this.mergeSameEdges(edges);
    }
}

export default new SolveMapManager();
