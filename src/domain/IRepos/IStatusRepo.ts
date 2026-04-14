import { Status } from "..";
import {
  CreateStatusDto,
  UpdateStatusDto,
} from "../DTOs/statusDTO";
import { FindStatusOptions } from '../types';

export interface IStatusRepo {
  create(status: CreateStatusDto): Promise<Status>;
  update(status: UpdateStatusDto): Promise<Status>;
  delete(id: string): Promise<boolean>;
  find(where: FindStatusOptions): Promise<Status[]>;
}
