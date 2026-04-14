import { Request, Response, NextFunction } from "express";
import { Token } from "../enums/token";

/**
 * Middleware to restrict access based on token types.
 *
 * @param {...Token[]} types - The allowed token types for the request.
 * @returns {Function} Middleware function to validate token type.
 *
 * @param req - The incoming HTTP request object.
 * @param res - The outgoing HTTP response object.
 * @param next - The next middleware function in the stack.
 *
 * @remarks
 * - The `tokenType` is expected to be provided in the request body.
 * - If the `tokenType` is missing or invalid, the middleware responds with a 403 status code and an error message.
 * - Logs an error message to the console if the token type is missing or invalid.
 *
 * @throws {403} If the `tokenType` is missing or invalid.
 *
 * @example
 * // Example of using the middleware in an Express route
 * app.use('/protected-route', restrictTokens(Token.ACCESS, Token.REFRESH), controller);
 */
export const restrictTokens =
  (...types: Token[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { tokenType } = req.user!;
    if (!tokenType) {
      res.status(403).json({
        message: "Not authorized, unknown token type",
        success: false,
      });
      console.error('"Not authorized, tokenType is undefined"');
      return;
    }

    if (!types.includes(tokenType)) {
      res.status(403).json({
        message: "Not authorized, invalid token type",
        success: false,
      });
      console.error('"Not authorized, invalid token type"');
      return;
    }

    next();
  };
