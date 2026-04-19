import { container } from "tsyringe";
import { StatusController } from "../controllers/status.controller";
import { BaseRoute } from "./base.route";
import { ProjectPermission } from "../../domain/types";
import { Token } from "../enums/token";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";
import { restrictTo } from "../middlewares/permissions.middleware";
import { restrictTokens } from "../middlewares/tokenTypes.middleware";

export class StatusRoutes extends BaseRoute {
  public path = "/:projectId/statuses";

  protected initRoutes(): void {
    const controller = container.resolve(StatusController);

    // Apply authentication and authorization to all status routes
    this.router.use(authenticate);
    this.router.use(authorizeProjectAccess);

    this.router.post(
      "/",
      restrictTokens(Token.ACCESS),
      restrictTo(ProjectPermission.MODERATOR),
      controller.create.bind(controller)
    );

    this.router.patch(
      "/",
      restrictTokens(Token.ACCESS),
      restrictTo(ProjectPermission.MODERATOR),
      controller.update.bind(controller)
    );

    this.router.delete(
      "/:id",
      restrictTokens(Token.ACCESS),
      restrictTo(ProjectPermission.MODERATOR),
      controller.delete.bind(controller)
    );

    this.router.get(
      "/",
      restrictTokens(Token.ACCESS),
      controller.find.bind(controller)
    );
  }
}
