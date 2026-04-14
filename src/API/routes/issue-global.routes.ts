import { container } from "tsyringe";
import { BaseRoute } from "./base.route";
import { IssueController } from "../controllers/issue.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Router } from "express";

export class IssueGlobalRoutes extends BaseRoute {
  public path = "/issues";

  constructor() {
    super();
    this.router = Router({ mergeParams: true });
    this.initRoutes(); 
  }
  protected initRoutes(): void {
    const controller = container.resolve(IssueController);
    
    // GET /api/issues/:userId - Get issues assigned to a specific user
    this.router.get("/:userId", authenticate, controller.getAssignedToUser.bind(controller));
  }
}
