import { Sprint } from "../entities";
import { CreateSprintDto, UpdateSprintDto } from "../DTOs/sprintDTO";

export interface FindSprintOptions {
  projectId?: string;
  id?: string;
}

export interface ISprintRepo {
  create(data: CreateSprintDto): Promise<Sprint>;
  update(data: UpdateSprintDto): Promise<Sprint>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<Sprint | null>;
  find(options: FindSprintOptions): Promise<Sprint[]>;
}
