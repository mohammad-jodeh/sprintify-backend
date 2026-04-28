import { container } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { BaseRoute } from "./base.route";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { restrictTokens } from "../middlewares/tokenTypes.middleware";
import { Token } from "../enums/token";

export class UserRoutes extends BaseRoute {
  public path = "/user";
  protected initRoutes(): void {
    const controller = container.resolve(UserController);

    // Middleware to prevent user enumeration - allow email search but restrict ID search to own profile
    const restrictUserSearch = (req: Request, res: Response, next: NextFunction) => {
      const searchId = req.query.id as string;
      const userId = req.user?.id;

      // Only allow searching own user ID, but allow searching by email
      if (searchId && searchId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own user information",
        });
      }
      next();
    };

    this.router.post("/register", controller.register.bind(controller));
    this.router.post("/login", controller.login.bind(controller));
    this.router.post(
      "/verify-email",
      authenticate,
      restrictTokens(Token.EMAIL_VERIFICATION),
      controller.verifyEmail.bind(controller),
    );
    this.router.post(
      "/forget-password",
      controller.forgetPassword.bind(controller),
    );
    this.router.post(
      "/password-reset",
      authenticate,
      restrictTokens(Token.RESET_PASSWORD, Token.ACCESS),
      controller.resetPassword.bind(controller),
    );
    this.router.get(
      "/search",
      authenticate,
      restrictUserSearch,
      controller.getUserByEmailOrId.bind(controller),
    );
  }
}
