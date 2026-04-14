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
      const res = await this._boardColumnRepo.update(dto.id, dto);
      if (res.affected === 0) {
        throw new UserError("BoardColumn not found or no changes made.", 404);
      }

      return this._boardColumnRepo.findOneOrFail({ where: { id: dto.id } });
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
}
