export class DBConstraintError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string | string[], statusCode: number = 409) {
    // 409 Conflict
    super(Array.isArray(message) ? message.join(", ") : message);
    this.statusCode = statusCode;
    this.name = "DBConstraintError";

    if (Array.isArray(message)) {
      this.errors = message;
    }

    Object.setPrototypeOf(this, DBConstraintError.prototype);
  }
}
