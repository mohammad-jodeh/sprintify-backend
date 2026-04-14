import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { ProjectService } from "../../app/services/project.service";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  CreateProjectDto,
  UpdateProjectDTO,
  ProjectResponseDto,
} from "../../domain/DTOs/projectDTO";
import { UserError } from "../../app/exceptions";
import { FindProjectOptions } from "../../domain/types";

@injectable()
export class ProjectController {
  constructor(@inject(ProjectService) private projectService: ProjectService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    const creator = req.user?.id;

    const dto = plainToInstance(CreateProjectDto, {
      ...req.body,
      createdBy: creator,
    });

    try {
      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }

      const project = await this.projectService.create(dto);
      res
        .status(201)
        .json({ project: new ProjectResponseDto(project), success: true });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(UpdateProjectDTO, req.body, {
      excludeExtraneousValues: true,
    });

    try {
      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }
      const project = await this.projectService.update(dto);
      res
        .status(200)
        .json({ project: new ProjectResponseDto(project), success: true });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await this.projectService.delete(id);
      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async find(req: Request, res: Response, next: NextFunction) {
    const user = req.user?.id;
    const query = req.query;
    const where: FindProjectOptions = {
      ...query,
    };

    try {
      const projects = await this.projectService.find(where, user!);
      res.status(200).json({
        projects: projects.map((p) => new ProjectResponseDto(p)),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const user = req.user?.id;

    try {
      const projects = await this.projectService.find({ id }, user!);
      if (!projects.length) {
        res.status(404).json({
          success: false,
          message: "Project not found"
        });
        return;
      }
      res.status(200).json({
        project: new ProjectResponseDto(projects[0]),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
