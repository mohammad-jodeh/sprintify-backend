import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";
import { BaseRoute } from "./base.route";
import { BoardColumnController } from "../controllers/board-column.controller";
import { container } from "tsyringe";
import { restrictTo } from "../middlewares/permissions.middleware";
import { restrictTokens } from "../middlewares/tokenTypes.middleware";
import { Token } from "../enums/token";
import { ProjectPermission } from "../../domain/types";

export class BoardColumnRoutes extends BaseRoute {
  public path = "/:projectId/board-columns";

  protected initRoutes(): void {
    const controller = container.resolve(BoardColumnController);

    // Apply authentication and authorization to all board column routes
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

    this.router.patch(
      "/bulk/reorder",
      restrictTokens(Token.ACCESS),
      restrictTo(ProjectPermission.MODERATOR),
      controller.updateBulk.bind(controller)
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
      controller.get.bind(controller)
    );
  }
}
