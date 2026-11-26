import {BaseUserSet} from "./BaseUserSet";

/** 题库里交到隐藏题（problem.defunct = 'Y'）的提交：状态页实时推送只发给有权限的连接 */
export class HiddenProblemSubmission extends BaseUserSet{}

export default new HiddenProblemSubmission();
