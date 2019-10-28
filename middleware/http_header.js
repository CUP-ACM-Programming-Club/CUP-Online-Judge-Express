const cluster = require("cluster");
module.exports = function(req,res,next){
	const exec_start_at = Date.now();
	const _send = res.send;
	res.send = function(){
		res.set("X-Execution-Time",String(Date.now() - exec_start_at));
		if (cluster.isWorker) {
			res.set("Cluster-Id", cluster.worker.id);
		}
		return _send.apply(res,arguments);
	};
	next();
};
