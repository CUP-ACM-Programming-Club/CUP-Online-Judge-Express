import md5 from "./md5";

export default function parameterHash (payload: any): string {
    if (typeof payload === "string") {
        return payload;
    }
    else if (typeof payload === "number") {
        return payload.toString();
    }
    else if (typeof payload === "undefined") {
        return "undefined";
    }
    else if (payload === null) {
        return "null";
    }
    else {
        return md5(JSON.stringify(payload));
    }
};
