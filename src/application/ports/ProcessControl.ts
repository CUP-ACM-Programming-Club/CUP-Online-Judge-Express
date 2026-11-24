import { definePort } from "./registry";

/** 进程生命周期控制（集群热重启）。实现：main/cluster/hot-reload */
export interface ProcessControl {
	restartNotify(): void;
}

export const processControl = definePort<ProcessControl>("ProcessControl");
