import { plainToInstance } from "class-transformer";
import { inject, injectable } from "tsyringe";
import {
  CreateProjectMemberDto,
  ProjectMemberResponseDto,
  UpdateProjectMemberDto,
} from "../../domain/DTOs/projectMemberDTO";
import { NextFunction, Request, Response } from "express";
import { UserError } from "../../app/exceptions";
import { validate } from "class-validator";
import { ProjectMembersService } from "../../app/services/project-members.service";

@injectable()
export class ProjectMembersController {
  constructor(
    @inject(ProjectMembersService) private service: ProjectMembersService
  ) {}

  async add(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(
      CreateProjectMemberDto,
      {
        ...req.body,
        projectId: req.params.projectId,
      },
      {
        excludeExtraneousValues: true,
      }
    );

    try {
      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }

      const membership = await this.service.add(dto);
      res.status(201).json({
        membership: new ProjectMemberResponseDto(membership),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(
      UpdateProjectMemberDto,
      {
        ...req.body,
        projectId: req.params.projectId,
      },
      {
        excludeExtraneousValues: true,
      }
    );

    try {
      const errors = await validate(dto);
      if (errors.length) {
        throw new UserError(errors);
      }

      const membership = await this.service.update(dto);
      res.status(200).json({
        membership: new ProjectMemberResponseDto(membership),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    const { membershipId } = req.params;

    try {
      await this.service.remove(membershipId);
      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const where = { projectId: req.params.projectId };
      const memberships = await this.service.find(where);

      res.status(200).json({
        memberships: memberships.map(
          (membership) => new ProjectMemberResponseDto(membership)
        ),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
