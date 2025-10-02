class ApiResponse {
    constructor(statuscode, success, message, data = null) {
        this.success = success < 400;
        this.message = message;
        this.data = data;
        this.statuscode = statuscode;
    }
}

export { ApiResponse };
