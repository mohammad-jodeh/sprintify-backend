import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { BoardColumnService } from "../../app/services/board-column.service";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  CreateBoardColumnDto,
  UpdateBoardColumnDto,
  BoardColumnResponseDto,
} from "../../domain/DTOs/board-columnDTO";
import { UserError } from "../../app/exceptions";

@injectable()
export class BoardColumnController {
  constructor(
    @inject(BoardColumnService)
    private boardColumnService: BoardColumnService
  ) {}

  async create(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(
      CreateBoardColumnDto,
      {
        ...req.body,
        projectId: req.params.projectId as string,
      },
      {
        excludeExtraneousValues: true,
      }
    );

    try {
      const errors = await validate(dto);

      if (errors.length) throw new UserError(errors);

      const column = await this.boardColumnService.create(dto);

      res.status(201).json({
        column: new BoardColumnResponseDto(column),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    const dto = plainToInstance(UpdateBoardColumnDto, req.body, {
      excludeExtraneousValues: true,
    });

    try {
      const errors = await validate(dto);

      if (errors.length) throw new UserError(errors);

      const column = await this.boardColumnService.update(dto);

      res.status(200).json({
        column: new BoardColumnResponseDto(column),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBulk(req: Request, res: Response, next: NextFunction) {
    const dtos = Array.isArray(req.body) 
      ? req.body 
      : [req.body];

    try {
      const validatedDtos = await Promise.all(
        dtos.map(async (dto) => {
          const instance = plainToInstance(UpdateBoardColumnDto, dto, {
            excludeExtraneousValues: true,
          });
          const errors = await validate(instance);
          if (errors.length) throw new UserError(errors);
          return instance;
        })
      );

      const columns = await this.boardColumnService.updateBulk(validatedDtos);

      res.status(200).json({
        columns: columns.map((col) => new BoardColumnResponseDto(col)),
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params as { id: string };
    try {
      if (!id) {
        throw new UserError("Column ID is required", 400);
      }

      await this.boardColumnService.delete(id);
      res.status(204).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    const { projectId } = req.params as { projectId: string };

    try {
      const columns =
        (await this.boardColumnService.getByProject(projectId))?.map(
          (col) => new BoardColumnResponseDto(col)
        ) || [];
 
      res.status(200).json({ columns, success: true });
    } catch (error) {
      next(error);
    }
  }
}
