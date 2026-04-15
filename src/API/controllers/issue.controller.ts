import { Request, Response, NextFunction } from "express";
import { IssueService } from "../../app/services/issue.service";
import { CreateIssueDto, UpdateIssueDto } from "../../domain/DTOs/issueDTO";
import { IssueType, issuePriority } from "../../domain/types";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { injectable, inject } from "tsyringe"; // Added inject
import "../types"; // Import types to extend Request interface

@injectable() // Added injectable decorator
export class IssueController {
  constructor(@inject(IssueService) private issueService: IssueService) {}

  
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params as { projectId: string };
      const userId = req.user?.id; // changed from req.body.userId
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const createIssueDto = plainToClass(CreateIssueDto, {
        ...req.body,
        projectId,
      });

      const errors = await validate(createIssueDto);
      if (errors.length > 0) {
        const validationError = new Error("Validation failed");
        (validationError as any).status = 400;
        (validationError as any).details = errors.map(error => ({
          property: error.property,
          constraints: error.constraints,
        }));
        throw validationError;
      }

      const issue = await this.issueService.create(userId, createIssueDto);

      res.status(201).json({
        message: "Issue created successfully",
        data: issue,
      });
    } catch (error: any) {
      // res.status(error.status || 500).json({
      //   message: error.message || "Internal server error",
      // });
      next(error); // Pass error to error middleware
    }
  }

  // GET /api/projects/:projectId/issues (partial/lightweight)
  async getAll(req: Request, res: Response): Promise<void> { // Renamed from getProjectIssues
    try {
      const { projectId } = req.params as { projectId: string };
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      // Pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20)); // Max 100
      const skip = (page - 1) * limit;

      const {
        sprintId,
        assignee,
        statusId,
        epicId,
        parentId,
        type,
        priority,
      } = req.query;      const options = {
        sprintId: sprintId as string | undefined,
        assignee: assignee as string | undefined,
        statusId: statusId as string | undefined,
        epicId: epicId as string | undefined,
        parentId: parentId as string | undefined,
        type: type ? (type as IssueType) : undefined,
        priority: priority ? (priority as issuePriority) : undefined,
        skip,
        limit,
      };
  
      const result = await this.issueService.getAll( // Renamed from getPartialIssues
        userId,
        projectId,
        options
      );

      // If result is an array, wrap it in pagination object for backward compatibility
      if (Array.isArray(result)) {
        res.status(200).json({
          message: "Issues retrieved successfully",
          data: result,
          pagination: {
            page,
            limit,
            total: result.length, // Backend should return this
            hasMore: result.length >= limit,
          },
        });
      } else {
        // Service returns object with issues and total
        res.status(200).json({
          message: "Issues retrieved successfully",
          data: result.issues || [],
          pagination: {
            page,
            limit,
            total: result.total || 0,
            hasMore: skip + (result.issues?.length || 0) < (result.total || 0),
          },
        });
      }
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  // GET /api/issues/:id (full details)
  async getById(req: Request, res: Response): Promise<void> { // Renamed from getIssueById
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const issue = await this.issueService.getById(userId, id); // Renamed from getFullIssue

      res.status(200).json({
        message: "Issue retrieved successfully",
        data: issue,
      });
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  async getByKey(req: Request, res: Response) {
    try {
      const { key } = req.params as { key: string };
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const issue = await this.issueService.getByKey(userId, key); // Renamed from getIssueByKey

      return res.status(200).json({
        message: "Issue retrieved successfully",
        data: issue,
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  // PUT /api/issues/:id
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const updateIssueDto = plainToClass(UpdateIssueDto, req.body);

      const errors = await validate(updateIssueDto);
      if (errors.length > 0) {
        res.status(400).json({
          message: "Validation failed",
          errors: errors.map(error => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
        return;
      }

      const issue = await this.issueService.update(userId, id, updateIssueDto); // Renamed from updateIssue

      res.status(200).json({
        message: "Issue updated successfully",
        data: issue,
      });
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  // DELETE /api/issues/:id
  async delete(req: Request, res: Response): Promise<void> { // Renamed from deleteIssue
    try {
      const { id } = req.params as { id: string };
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      await this.issueService.delete(userId, id); // Renamed from deleteIssue

      res.status(200).json({
        message: "Issue deleted successfully",
      });
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  // GET /api/issues/my-assigned (issues assigned to current user)
  async getMyAssigned(req: Request, res: Response): Promise<void> { // Renamed from getMyAssignedIssues
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }      const {
        projectId, // Optional project filter
        sprintId,
        statusId,
        epicId,
        parentId,
        type,
        priority,        searchTerm,
      } = req.query;

      const options = {
        sprintId: sprintId as string | undefined,
        statusId: statusId as string | undefined,
        epicId: epicId as string | undefined,
        parentId: parentId as string | undefined,
        type: type ? (type as IssueType) : undefined,
        priority: priority ? (priority as issuePriority) : undefined,
        searchTerm: searchTerm as string | undefined,
      };

      const issues = await this.issueService.getMyAssigned( // Renamed from getMyAssignedIssues
        userId,
        projectId as string | undefined,
        options
      );

      res.status(200).json({
        message: "Assigned issues retrieved successfully",
        data: issues,
      });
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  // GET /api/issues/assigned/:userId (issues assigned to a specific user)
  async getAssignedToUser(req: Request, res: Response): Promise<void> {
    try {
      const requestUserId = req.user?.id;
      const { userId: assigneeUserId } = req.params as { userId: string };
      
      if (!requestUserId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const {
        projectId, // Optional project filter
        sprintId,
        statusId,
        epicId,
        parentId,
        type,
        priority,
        searchTerm,
      } = req.query;      const options = {
        sprintId: sprintId as string | undefined,
        statusId: statusId as string | undefined,
        epicId: epicId as string | undefined,
        parentId: parentId as string | undefined,
        type: type ? (type as IssueType) : undefined,
        priority: priority ? (priority as issuePriority) : undefined,
        searchTerm: searchTerm as string | undefined,
      };

      const issues = await this.issueService.getAssignedToUser(
        requestUserId,
        assigneeUserId,
        projectId as string | undefined,
        options
      );

      res.status(200).json({
        message: "Issues assigned to user retrieved successfully",
        data: issues,
      });
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }
  // GET /api/sprints/:id/issues
  async getBySprint(req: Request, res: Response): Promise<void> { // Renamed from getSprintIssues
    try {
      const { id: sprintId } = req.params as { id: string };
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
        const {
        projectId,
        assignee,
        statusId,
        epicId,
        parentId,
        type,
        priority,
        searchTerm,
      } = req.query;      const options = {
        projectId: projectId as string | undefined,
        assignee: assignee as string | undefined,
        statusId: statusId as string | undefined,
        epicId: epicId as string | undefined,
        parentId: parentId as string | undefined,
        type: type ? (type as IssueType) : undefined,
        priority: priority ? (priority as issuePriority) : undefined,
        searchTerm: searchTerm as string | undefined,
      };

      const issues = await this.issueService.getBySprint(userId, sprintId, options); // Renamed from getSprintIssues

      res.status(200).json({
        message: "Sprint issues retrieved successfully",
        data: issues,
      });
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }

  // GET /api/epics/:epicId/issues
  async getByEpic(req: Request, res: Response): Promise<void> { // Renamed from getEpicIssues
    try {
      const { epicId } = req.params as { epicId: string };
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }      const {
        projectId,
        assignee,
        statusId,
        // epicId is a param, so not needed in query for this specific route
        parentId,
        type,
        priority,
        searchTerm,
      } = req.query;      const options = {
        projectId: projectId as string | undefined,
        assignee: assignee as string | undefined,
        statusId: statusId as string | undefined,
        parentId: parentId as string | undefined,
        type: type ? (type as IssueType) : undefined,
        priority: priority ? (priority as issuePriority) : undefined,
        searchTerm: searchTerm as string | undefined,
      };

      const issues = await this.issueService.getByEpic(userId, epicId, options); // Renamed from getEpicIssues

      res.status(200).json({
        message: "Epic issues retrieved successfully",
        data: issues,
      });
    } catch (error: any) {
      res.status(error.status || 500).json({
        message: error.message || "Internal server error",
      });
    }
  }
}
