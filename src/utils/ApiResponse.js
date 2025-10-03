class ApiResponse {
    constructor(statusCode, data = null, message = "") {
        this.statusCode = statusCode;
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
    }
}

export { ApiResponse };
