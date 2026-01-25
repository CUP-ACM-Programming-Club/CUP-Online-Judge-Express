export class HttpError extends Error {
    public status: string;
    public statement: string;
    public statusCode: number;

    constructor(statement: string, statusCode: number = 500, status: string = "error") {
        super(statement);
        this.statement = statement;
        this.statusCode = statusCode;
        this.status = status;
        Object.setPrototypeOf(this, HttpError.prototype);
    }

    static badRequest(statement: string) {
        return new HttpError(statement, 400);
    }

    static unauthorized(statement: string) {
        return new HttpError(statement, 401);
    }

    static forbidden(statement: string) {
        return new HttpError(statement, 403);
    }

    static notFound(statement: string) {
        return new HttpError(statement, 404);
    }

    static internalError(statement: string = "Internal Server Error") {
        return new HttpError(statement, 500);
    }
}

export default HttpError;
