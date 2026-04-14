import { ValidationError } from "class-validator";

export class UserError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(
    message: string | string[] | ValidationError[],
    statusCode: number = 400,
  ) {
    let finalMessage: string;
    let errorList: string[] | undefined;

    if (
      Array.isArray(message) &&
      message.length &&
      message[0] instanceof ValidationError
    ) {
      errorList = (message as ValidationError[]).flatMap((err) =>
        Object.values(err.constraints || {}),
      );
      finalMessage = errorList.join(", ");
    } else if (Array.isArray(message)) {
      errorList = message as string[];
      finalMessage = errorList.join(", ");
    } else {
      finalMessage = message;
    }

    super(finalMessage);
    this.statusCode = statusCode;
    this.name = "UserError";

    if (errorList) {
      this.errors = errorList;
    }

    Object.setPrototypeOf(this, UserError.prototype);
  }
}
