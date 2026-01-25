export interface SubmissionData {
    source: string;
    type: string;
    language: number | string;
    id: number | string; // Problem ID or other ID depending on input context
    cid?: number | string; // Contest ID field from input
    pid?: number | string; // Problem Num in Contest/Topic
    tid?: number | string; // Topic ID
    fingerprint?: string;
    fingerprintRaw?: string;
    share?: boolean;
    input_text?: string;
    [key: string]: any; // Allow loose props until fully strict
}

export interface SubmissionResponse {
    status: string;
    solution_id: number;
}
