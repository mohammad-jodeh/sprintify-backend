import { Epic } from "../entities";

export interface IEpicRepo {
  get(projectId: string): Promise<Epic[]>;
  getById(id: string): Promise<Epic | null>;
  find(options: Partial<Epic>): Promise<Epic[]>;
  create(epic: Partial<Epic>): Promise<Epic>;
  update(id: string, epicData: Partial<Epic>): Promise<Epic | null>;
  delete(id: string): Promise<boolean>;
}
