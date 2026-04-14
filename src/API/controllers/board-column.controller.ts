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
        projectId: req.params.projectId,
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

  async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
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
    const { projectId } = req.params;

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
