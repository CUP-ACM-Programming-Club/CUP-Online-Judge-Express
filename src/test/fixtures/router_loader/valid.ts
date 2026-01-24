export = ["/foo", function noop(req: any, res: any, next: any) {
	if (typeof next === "function") {
		next();
	}
}];
