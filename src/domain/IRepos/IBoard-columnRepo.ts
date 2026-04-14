import {
  CreateBoardColumnDto,
  UpdateBoardColumnDto,
} from "../DTOs/board-columnDTO";
import { BoardColumn } from "../entities";
import { FindBoardColumnOptions } from '../types';

export interface IBoardColumnRepo {
  create(dto: CreateBoardColumnDto): Promise<BoardColumn>;
  update(dto: UpdateBoardColumnDto): Promise<BoardColumn>;
  delete(id: string): Promise<boolean>;
  find(where: FindBoardColumnOptions): Promise<BoardColumn[]>;
}
