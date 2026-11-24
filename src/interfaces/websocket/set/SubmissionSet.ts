import {BaseUserSet} from "./BaseUserSet";
import {Socket} from "socket.io";

export class SubmissionSet extends BaseUserSet<Socket>{
}

const submissionSet = new SubmissionSet();

export default submissionSet;
