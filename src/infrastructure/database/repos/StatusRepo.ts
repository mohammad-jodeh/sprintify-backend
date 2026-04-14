import { Repository } from "typeorm";
import { Status } from "../../../domain";
import {
  CreateStatusDto,
  UpdateStatusDto,
} from "../../../domain/DTOs/statusDTO";
import { IStatusRepo } from "../../../domain/IRepos/IStatusRepo";
import { AppDataSource } from "../data-source";
import { getDBError } from "../utils/handleDBErrors";
import { UserError } from "../../../app/exceptions";
import { FindStatusOptions } from "../../../domain/types";
import { injectable } from 'tsyringe';

@injectable()
export class StatusRepo implements IStatusRepo {
  private _repo: Repository<Status>;

  constructor() {
    this._repo = AppDataSource.getRepository(Status);
  }

  async create(status: CreateStatusDto): Promise<Status> {
    try {
      const newStatus = this._repo.create(status);
      return await this._repo.save(newStatus);
    } catch (error) {
      throw getDBError(error);
    }
  }

  async update(status: UpdateStatusDto): Promise<Status> {
    try {
      const res = await this._repo.update(status.id, status);
      if (res.affected === 0) {
        throw new UserError("Status not found or no changes made.", 404);
      }

      return await this._repo.findOneOrFail({ where: { id: status.id } });
    } catch (error) {
      throw getDBError(error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this._repo.delete(id);
      if (!result.affected) throw new UserError("Status not found.");
      return true;
    } catch (error) {
      throw getDBError(error);
    }
  }

  async find(where: FindStatusOptions): Promise<Status[]> {
    console.log("Finding statuses with options:", where);
    try {
      const queryBuilder = this._repo.createQueryBuilder("status");

      if (where.projectId) {
        queryBuilder.andWhere("status.projectId = :projectId", {
          projectId: where.projectId,
        });
      }

      if (where.id) {
        queryBuilder.andWhere("status.id = :id", { id: where.id });
      }

      if (where.name) {
        queryBuilder.andWhere("LOWER(status.name) LIKE :name", {
          name: `%${where.name.toLowerCase()}%`,
        });
      }

      if (where.type) {
        queryBuilder.andWhere("status.type = :type", { type: where.type });
      }

      if (where.columnId) {
        queryBuilder.andWhere("status.columnId = :columnId", {
          columnId: where.columnId,
        });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      throw getDBError(error);
    }
  }
}
