export default function (...args: any[]) {
    args.forEach(e => {
        if (typeof e !== "string") {
            throw new Error("RuleChecker failed. args should be string");
        }
    })
}
