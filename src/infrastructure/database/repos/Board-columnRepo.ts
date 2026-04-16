import { injectable } from "tsyringe";
import { AppDataSource } from "../data-source";
import { BoardColumn } from "../../../domain/entities";
import { IBoardColumnRepo } from "../../../domain/IRepos/IBoard-columnRepo";
import { UserError } from "../../../app/exceptions";
import { getDBError } from "../utils/handleDBErrors";
import {
  CreateBoardColumnDto,
  UpdateBoardColumnDto,
} from "../../../domain/DTOs/board-columnDTO";
import { FindBoardColumnOptions } from "../../../domain/types";

@injectable()
export class BoardColumnRepo implements IBoardColumnRepo {
  private _boardColumnRepo;

  constructor() {
    this._boardColumnRepo = AppDataSource.getRepository(BoardColumn);
  }

  async create(dto: CreateBoardColumnDto): Promise<BoardColumn> {
    try {
      const column = this._boardColumnRepo.create(dto);
      return await this._boardColumnRepo.save(column);
    } catch (error) {
      throw getDBError(error);
    }
  }

  async update(dto: UpdateBoardColumnDto): Promise<BoardColumn> {
    try {
      // ⚡ BUGFIX: Exclude 'id' from update payload - never update primary keys!
      // Only update the fields that should change: name and order
      const { id, ...updatePayload } = dto;
      
      const res = await this._boardColumnRepo.update(id, updatePayload);
      if (res.affected === 0) {
        throw new UserError("BoardColumn not found or no changes made.", 404);
      }

      return this._boardColumnRepo.findOneOrFail({ where: { id } });
    } catch (error) {
      throw getDBError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this._boardColumnRepo.delete(id);
      if (!result.affected) throw new UserError("BoardColumn not found");
      return true;
    } catch (error) {
      throw getDBError(error);
    }
  }

  async find(where: FindBoardColumnOptions): Promise<BoardColumn[]> {
    try {
      return await this._boardColumnRepo.find({
        where,
        order: { order: "ASC" as const },
        relations: ["statuses"],
      });
    } catch (error) {
      throw getDBError(error);
    }
  }

  async updateBulk(updates: UpdateBoardColumnDto[]): Promise<BoardColumn[]> {
    try {
      // Use transaction to avoid unique constraint violations
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Update all columns with temporary negative orders to avoid constraint violations
        for (let i = 0; i < updates.length; i++) {
          const tempOrder = -(i + 1); // Use negative temp order: -1, -2, -3, etc.
          await queryRunner.manager.update(
            BoardColumn,
            updates[i].id,
            { order: tempOrder }
          );
        }

        // Now update to final order values
        const updatedColumns: BoardColumn[] = [];
        for (const update of updates) {
          const { id, ...updatePayload } = update;
          await queryRunner.manager.update(BoardColumn, id, updatePayload);
          const column = await queryRunner.manager.findOneOrFail(BoardColumn, {
            where: { id },
          });
          updatedColumns.push(column);
        }

        await queryRunner.commitTransaction();
        return updatedColumns;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      throw getDBError(error);
    }
  }
}
