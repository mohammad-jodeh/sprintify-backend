import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

/**
 * Middleware to authenticate incoming requests by verifying the provided JWT token.
 *
 * @param req - The incoming HTTP request object.
 * @param res - The outgoing HTTP response object.
 * @param next - The next middleware function in the stack.
 *
 * @remarks
 * - The token is expected to be provided in the `Authorization` header as a Bearer token.
 * - If the token is missing or invalid, the middleware responds with a 401 status code and an error message.
 * - If the token is valid, the decoded payload is attached to the `req.body` object.
 * - If the token type is `RESET_PASSWORD`, a `forget` flag is added to the request body to skip old password checks.
 *
 * @throws {401} If the token is missing, invalid, or the decoded payload lacks an email.
 *
 * @example
 * // Example of using the middleware in an Express route
 * app.use('/protected-route',authenticate, controller);
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    res
      .status(401)
      .json({ message: "Not authorized, token not found", success: false });
    console.error("❌ Request rejected: token not found");
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("🔴 CRITICAL: Required environment variable not set");
      res.status(500).json({ message: "Server configuration error", success: false });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded || !decoded.email) {
      res.status(401).json({ message: "Not authorized, email not found", success: false });
      return;
    }

    req.user = decoded as any; // <-- assign decoded payload to req.user

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired, please login again", success: false });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Not authorized, invalid token", success: false });
    } else {
      res.status(401).json({ message: "Not authorized", success: false });
    }
    return;
  }
};
