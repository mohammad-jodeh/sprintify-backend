import { injectable, inject } from "tsyringe";
import { NextFunction, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { CreateStatusDto, UpdateStatusDto } from "../../domain/DTOs/statusDTO";
import { validate } from "class-validator";
import { UserError } from "../../app/exceptions";
import { StatusService } from "../../app/services/status.service";
import { FindStatusOptions } from "../../domain/types";

@injectable()
export class StatusController {
  constructor(@inject(StatusService) private service: StatusService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(CreateStatusDto, {
      ...req.body,
      projectId: req.params.projectId
    }, {
      excludeExtraneousValues: true,
    });

    try {
      const error = await validate(dto);
      if (error.length) {
        throw new UserError(error);
      }

      const status = await this.service.create(dto);

      res.status(201).json({ status, success: true });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(UpdateStatusDto, {
      ...req.body,
      projectId: req.params.projectId
    }, {
      excludeExtraneousValues: true,
    });

    try {
      const error = await validate(dto);
      if (error.length) {
        throw new UserError(error);
      }

      const status = await this.service.update(dto);

      res.status(200).json({ status, success: true });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;

    try {
      const deleted = await this.service.delete(id);
      if (!deleted) {
        throw new UserError("Status not found", 404);
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async find(req: Request, res: Response, next: NextFunction) {
    const where: FindStatusOptions = {
      ...req.body,
      projectId: req.params.projectId,
    };

    try {
      const statuses = await this.service.find(where);

      res.status(200).json({ statuses, success: true });
    } catch (error) {
      next(error);
    }
  }
}
