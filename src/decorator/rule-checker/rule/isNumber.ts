export default function (...args: any[]) {
    args.forEach(e => {
        if (typeof e !== "number") {
            throw new Error("RuleChecker failed. args should be number.");
        }
    })
}
