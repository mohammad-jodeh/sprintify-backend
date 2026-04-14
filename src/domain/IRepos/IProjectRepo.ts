import { CreateProjectDto, UpdateProjectDTO } from "../DTOs/projectDTO";
import { Project } from "../entities";
import { FindProjectOptions } from "../types";

export interface IProjectRepo {
  create(dto: CreateProjectDto): Promise<Project>;
  update(dto: UpdateProjectDTO): Promise<Project>;
  delete(id: string): Promise<void>;
  find(options: FindProjectOptions, userId?: string): Promise<Project[]>;
}
