import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../infrastructure/database/data-source";
import { ProjectMember } from "../../domain/entities";

/**
 * Middleware to authorize project access
 * Ensures user is a member of the project they're trying to access
 * 
 * @param req - The incoming HTTP request object (must have user from auth middleware)
 * @param res - The outgoing HTTP response object
 * @param next - The next middleware function in the stack
 * 
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not a member of the project
 * @throws {404} If project doesn't exist
 */
export const authorizeProjectAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const projectId = req.params.projectId;

    if (!userId) {
      res.status(401).json({ message: "Not authenticated", success: false });
      return;
    }

    if (!projectId) {
      res.status(400).json({ message: "Project ID is required", success: false });
      return;
    }

    // Check if user is a member of the project
    const projectMemberRepository = AppDataSource.getRepository(ProjectMember);
    const membership = await projectMemberRepository.findOne({
      where: {
        userId,
        projectId,
      },
    });

    if (!membership) {
      res.status(403).json({ 
        message: "You don't have access to this project", 
        success: false 
      });
      return;
    }

    // Store membership in request for later use (permissions checking)
    (req as any).userPermission = membership.permission;

    next();
  } catch (error) {
    console.error("Authorization error details:", error instanceof Error ? error.message : error, error instanceof Error ? error.stack : "");
    res.status(500).json({ 
      message: "Authorization check failed", 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
