import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { SprintService } from "../../app/services/sprint.service";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  CreateSprintDto,
  UpdateSprintDto,
  SprintResponseDto,
} from "../../domain/DTOs/sprintDTO";
import { UserError } from "../../app/exceptions";
import { FindSprintOptions } from "../../domain/IRepos/ISprintRepo";

/**
 * Controller for managing sprints
 */
@injectable()
export class SprintController {
  /**
   * Creates a new SprintController instance
   * @param sprintService - The sprint service
   */
  constructor(@inject(SprintService) private sprintService: SprintService) {}

  /**
   * Creates a new sprint
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const dto = plainToInstance(CreateSprintDto, {
        ...req.body,
        projectId,
      });

      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }

      const sprint = await this.sprintService.create(dto);
      res.status(201).json({
        sprint: new SprintResponseDto(sprint),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing sprint
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dto = plainToInstance(UpdateSprintDto, {
        ...req.body,
        id,
      });

      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }

      const sprint = await this.sprintService.update(dto);
      res.status(200).json({
        sprint: new SprintResponseDto(sprint),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a sprint
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.sprintService.delete(id);
      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets a sprint by ID
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const sprint = await this.sprintService.findById(id);
      res.status(200).json({
        sprint: new SprintResponseDto(sprint),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets sprints based on query parameters
   * @param req - Request object
   * @param res - Response object
   * @param next - Next function
   */
  async find(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const options: FindSprintOptions = {
        projectId,
        ...req.query,
      };

      const sprints = await this.sprintService.find(options);
      res.status(200).json({
        sprints: sprints.map((sprint) => new SprintResponseDto(sprint)),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
