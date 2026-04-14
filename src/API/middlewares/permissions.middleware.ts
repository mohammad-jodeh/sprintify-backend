import { Request, Response, NextFunction } from "express";
import { ProjectPermission } from "../../domain/types";
import { container, inject } from "tsyringe";
import { IProjectMemberRepo } from "../../domain/IRepos/IProjectMemberRepo";

export function restrictTo(allowedPermission: ProjectPermission) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (req.method === "GET") {
      next();
      return;
    }
    const membersRepo: IProjectMemberRepo =
      container.resolve("IProjectMemberRepo");
    const membership = await membersRepo.find({
      userId: req.user?.id,
      projectId: req.params.projectId,
    });

    if (membership[0].permission < allowedPermission) {
      res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
}
