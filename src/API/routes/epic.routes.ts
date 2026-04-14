import { container } from "tsyringe";
import { BaseRoute } from "./base.route";
import { EpicController } from "../controllers/epic.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";
import { restrictTokens } from "../middlewares/tokenTypes.middleware";
import { Token } from "../enums/token";
import { Router } from "express";

export class EpicRoutes extends BaseRoute {
  public path = "/:projectId/epic";

  constructor() {
    super();
    this.router = Router({ mergeParams: true });
    this.initRoutes();
  }

  protected initRoutes(): void {
    const controller = container.resolve(EpicController);

    this.router.use(authenticate);
    this.router.use(authorizeProjectAccess);
    this.router.use(restrictTokens(Token.ACCESS));

    this.router.post("/", controller.create.bind(controller));
    this.router.patch("/:id", controller.update.bind(controller));
    this.router.delete("/:id", controller.delete.bind(controller));

    this.router.get("/", controller.get.bind(controller));
    this.router.get("/key/:key", controller.getByKey.bind(controller));
    this.router.get("/:id", controller.getById.bind(controller));
    this.router.get("/:epicId/issues", controller.getEpicIssues.bind(controller));
  }
}
