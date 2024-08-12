class ApiResponse {
    constructor(statusCode, data, message="success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message= message;
        this.success = statusCode < 400  // because every sucees is less than 400 status code
    }
}

export {ApiResponse}