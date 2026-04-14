declare global {
  namespace Express {
    interface Request {
      user?: ITokenPayload;
    }
  }
}

import { Token } from "./enums/token";

export interface ITokenPayload {
  id: string;
  email: string;
  isEmailVerified: boolean;
  tokenType: Token;
}
