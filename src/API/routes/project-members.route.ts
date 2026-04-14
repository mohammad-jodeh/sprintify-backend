import { container } from "tsyringe";
import { BaseRoute } from "./base.route";
import { ProjectMembersController } from "../controllers/project-member.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";
import { restrictTokens } from "../middlewares/tokenTypes.middleware";
import { restrictTo } from "../middlewares/permissions.middleware";
import { ProjectPermission } from "../../domain/types";
import { Token } from "../enums/token";

export class ProjectMembersRoutes extends BaseRoute {
  public path: string = "/:projectId/members";

  protected initRoutes(): void {
    const controller = container.resolve(ProjectMembersController);

    // Apply authentication and project authorization to all project member routes
    this.router.use(authenticate, authorizeProjectAccess);

    this.router.post(
      "",
      restrictTokens(Token.ACCESS),
      restrictTo(ProjectPermission.MODERATOR), // anyone with MODERATOR or higher can add members
      controller.add.bind(controller)
    );

    this.router.patch(
      "",
      restrictTokens(Token.ACCESS),
      restrictTo(ProjectPermission.MODERATOR),
      controller.update.bind(controller)
    );

    this.router.delete(
      "/:membershipId",
      restrictTokens(Token.ACCESS),
      restrictTo(ProjectPermission.MODERATOR),
      controller.remove.bind(controller)
    );

    this.router.get(
      "",
      restrictTokens(Token.ACCESS),
      controller.get.bind(controller)
    );
  }
}
