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

    console.log("📝 [STATUS-CREATE] Received request with DTO:", dto);

    try {
      const error = await validate(dto);
      if (error.length) {
        console.error("❌ [STATUS-CREATE] Validation failed:", error);
        throw new UserError(error);
      }

      console.log("✅ [STATUS-CREATE] Validation passed, creating status...");
      const status = await this.service.create(dto);
      console.log("✅ [STATUS-CREATE] Status created successfully:", status);

      res.status(201).json({ status, success: true });
    } catch (error) {
      console.error("❌ [STATUS-CREATE] Error:", error);
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
    const id = req.params.id as string;

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
    // Extract filter parameters from query string
    // Query params can be strings or arrays, so we normalize them
    const query = req.query as Record<string, any>;
    
    const where: FindStatusOptions = {
      projectId: req.params.projectId,
      // Add optional filters from query if provided
      ...(query.id && { id: Array.isArray(query.id) ? query.id[0] : query.id }),
      ...(query.name && { name: Array.isArray(query.name) ? query.name[0] : query.name }),
      ...(query.type && { type: Array.isArray(query.type) ? query.type[0] : query.type }),
      ...(query.columnId && { columnId: Array.isArray(query.columnId) ? query.columnId[0] : query.columnId }),
    };

    console.log("📋 [STATUS-FIND] Received find request with options:", { query: req.query, where });

    try {
      const statuses = await this.service.find(where);
      console.log(`✅ [STATUS-FIND] Found ${statuses.length} statuses for projectId: ${req.params.projectId}`);

      res.status(200).json({ statuses, success: true });
    } catch (error) {
      console.error("❌ [STATUS-FIND] Error finding statuses:", error);
      next(error);
    }
  }
}
