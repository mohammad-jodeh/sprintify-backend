import { sign } from "jsonwebtoken";
import { Token } from "../enums/token";
import { ITokenPayload } from "../types";

export const genToken = (payload: Partial<ITokenPayload>): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  if (!payload.tokenType) payload.tokenType = Token.ACCESS;
  
  const expiresIn = process.env.JWT_EXPIRY || "24h";
  
  return sign(payload, jwtSecret, {
    expiresIn: expiresIn as any,
  } as any);
};
