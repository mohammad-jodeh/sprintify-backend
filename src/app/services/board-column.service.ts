import { inject, injectable } from "tsyringe";
import { IBoardColumnRepo } from "../../domain/IRepos/IBoard-columnRepo";
import { BoardColumn } from "../../domain/entities";
import {
  CreateBoardColumnDto,
  UpdateBoardColumnDto,
} from "../../domain/DTOs/board-columnDTO";

@injectable()
export class BoardColumnService {
  constructor(
    @inject("IBoardColumnRepo") private boardColumnRepo: IBoardColumnRepo
  ) {}

  async create(dto: CreateBoardColumnDto): Promise<BoardColumn> {
    return await this.boardColumnRepo.create(dto);
  }

  async update(dto: UpdateBoardColumnDto): Promise<BoardColumn> {
    return await this.boardColumnRepo.update(dto);
  }

  async delete(id: string): Promise<boolean> {
    return await this.boardColumnRepo.delete(id);
  }

  async getByProject(projectId: string): Promise<BoardColumn[]> {
    return await this.boardColumnRepo.find({ projectId });
  }

  /**
   * Creates default columns (To Do, In Progress, Done)
   * when a project has no existing columns.
   */
  async createDefaultColumns(projectId: string): Promise<BoardColumn[]> {
    const defaults: CreateBoardColumnDto[] = [
      { name: "To Do", order: 0, projectId },
      { name: "In Progress", order: 1, projectId },
      { name: "Done", order: 2, projectId },
    ];

    const created: BoardColumn[] = [];

    for(let config of defaults) {
      const createdColumn = await this.boardColumnRepo.create(config);
      created.push(createdColumn);
    }

    return created;
  }
}
