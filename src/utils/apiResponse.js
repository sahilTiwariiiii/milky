class ApiResponse {
  static success(res, message, data = null, statusCode = 200, meta = null) {
    const payload = {
      success: true,
      message,
      ...(data !== null && { data }),
      ...(meta !== null && { meta })
    };
    return res.status(statusCode).json(payload);
  }

  static created(res, message, data = null) {
    return this.success(res, message, data, 201);
  }

  static error(res, message, statusCode = 500, errors = null) {
    const payload = {
      success: false,
      message,
      ...(errors && { errors })
    };
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
