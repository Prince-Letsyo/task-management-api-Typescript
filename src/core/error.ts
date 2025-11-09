class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message = 'Something went wrong', statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // for trusted errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Conflict keys') {
    super(message, 400);
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict keys') {
    super(message, 409);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

export default AppError;
