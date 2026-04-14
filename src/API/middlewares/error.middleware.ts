import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import {
  UserError,
  ServerError,
  DBConstraintError,
} from "../../app/exceptions";

const errorMiddleware: ErrorRequestHandler = (
  err: Error | UserError | ServerError | DBConstraintError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (err instanceof UserError || err instanceof DBConstraintError) {
    res.status(err.statusCode).json({
      status: "error",
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }), // Include errors if they exist
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: "error",
    success: false,
    message: "Something went wrong. Please try again later.",
  });
};

export default errorMiddleware;
