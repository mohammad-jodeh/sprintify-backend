import { container } from "tsyringe";
import { BaseRoute } from "./base.route";
import { IssueController } from "../controllers/issue.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";
import { Router } from "express";
export class IssueRoutes extends BaseRoute {
  public path = "/:projectId/issues";

  constructor() {
    super();
    this.router = Router({ mergeParams: true });
    this.initRoutes(); 
  }

  protected initRoutes(): void {
    const controller = container.resolve(IssueController);
    
    // Add authorization check first - all issue routes require project access
    this.router.use(authenticate);
    this.router.use(authorizeProjectAccess);
    
    this.router.post("/", controller.create.bind(controller));

    this.router.get("/", controller.getAll.bind(controller));  
    
    this.router.get("/:id", controller.getById.bind(controller));

    this.router.patch("/:id", controller.update.bind(controller));

    this.router.delete("/:id", controller.delete.bind(controller));
  }
}
