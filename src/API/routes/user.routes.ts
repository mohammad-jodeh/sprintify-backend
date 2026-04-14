import { container } from "tsyringe";
import { BaseRoute } from "./base.route";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { restrictTokens } from "../middlewares/tokenTypes.middleware";
import { Token } from "../enums/token";

export class UserRoutes extends BaseRoute {
  public path = "/user";
  protected initRoutes(): void {
    const controller = container.resolve(UserController);

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
      controller.getUserByEmailOrId.bind(controller),
    );
  }
}
