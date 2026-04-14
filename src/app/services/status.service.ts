import { inject, injectable } from "tsyringe";
import { IStatusRepo } from "../../domain/IRepos/IStatusRepo";
import { BoardColumn, Status, StatusType } from "../../domain";
import { CreateStatusDto, UpdateStatusDto } from "../../domain/DTOs/statusDTO";
import { FindStatusOptions } from "../../domain/types";

@injectable()
export class StatusService {
  constructor(@inject("IStatusRepo") private repo: IStatusRepo) {}

  async create(statusData: CreateStatusDto): Promise<Status> {
    return await this.repo.create(statusData);
  }

  async update(statusData: UpdateStatusDto): Promise<Status> {
    return await this.repo.update(statusData);
  }

  async delete(id: string): Promise<boolean> {
    return await this.repo.delete(id);
  }

  async find(where: FindStatusOptions): Promise<Status[]> {
    return await this.repo.find(where);
  }

  async createDefaultStatuses(
    defaultStatuses: CreateStatusDto[]
  ): Promise<Status[]> {
    const statuses: Status[] = [];

    for (const status of defaultStatuses) {
      const result = await this.repo.create(status);
      statuses.push(result);
    }

    return statuses;
  }
}
