import { PostgresErrorCodes } from "../errors";
import {
  UserError,
  ServerError,
  DBConstraintError,
} from "../../../app/exceptions";

export function getDBError(error: any) {
  const errorHandlers: Partial<
    Record<PostgresErrorCodes, { message: string; statusCode: number }>
  > = {
    [PostgresErrorCodes.NOT_NULL_VIOLATION]: {
      message: `Missing required field: ${error.column || "unknown field"}`,
      statusCode: 400,
    },
    [PostgresErrorCodes.FOREIGN_KEY_VIOLATION]: {
      message: "Referenced item does not exist",
      statusCode: 400,
    },
    [PostgresErrorCodes.UNIQUE_VIOLATION]: {
      message: "Duplicate value – already exists",
      statusCode: 409,
    },
    [PostgresErrorCodes.CHECK_VIOLATION]: {
      message: `Invalid value for field: ${error.column || "unknown field"}`,
      statusCode: 400,
    },
  };

  const handler = errorHandlers[error.code as PostgresErrorCodes];

  if (handler) {
    switch (error.code) {
      case PostgresErrorCodes.UNIQUE_VIOLATION:
      case PostgresErrorCodes.FOREIGN_KEY_VIOLATION:
      case PostgresErrorCodes.CHECK_VIOLATION:
        return new DBConstraintError([handler.message], handler.statusCode);
      case PostgresErrorCodes.NOT_NULL_VIOLATION:
        return new UserError([handler.message], handler.statusCode);
    }
  }

  return new ServerError(error.message, 500);
}
