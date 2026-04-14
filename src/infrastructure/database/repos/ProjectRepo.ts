import { injectable } from "tsyringe";
import { IProjectRepo } from "../../../domain/IRepos/IProjectRepo";
import { AppDataSource } from "../data-source";
import { getDBError } from "../utils/handleDBErrors";
import {
  CreateProjectDto,
  UpdateProjectDTO,
} from "../../../domain/DTOs/projectDTO";
import { Project } from "../../../domain/entities";
import { FindProjectOptions } from "../../../domain/types";
import { ServerError, UserError } from "../../../app/exceptions";

@injectable()
export class ProjectRepo implements IProjectRepo {
  private _projectRepo;

  constructor() {
    try {
      this._projectRepo = AppDataSource.getRepository(Project);
    } catch (error) {
      throw new ServerError("Could not initialize Project repository.", 500);
    }
  }

  async create(project: CreateProjectDto): Promise<Project> {
    try {

      const newProject = this._projectRepo.create(project);
      return await this._projectRepo.save(newProject);
    } catch (error) {
      throw getDBError(error);
    }
  }

  async update(project: UpdateProjectDTO): Promise<Project> {
    try {
      const res = await this._projectRepo.update(project.id, project);
      if (res.affected === 0) {
        throw new UserError("Project not found or no changes made.", 404);
      }

      return (await this.find({ id: project.id }))[0];
    } catch (error) {
      throw getDBError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this._projectRepo.delete(id);
    } catch (error) {
      throw getDBError(error);
    }
  }

  async find(options: FindProjectOptions, userId?: string): Promise<Project[]> {
    try {
      const queryBuilder = this._projectRepo
        .createQueryBuilder("project")
        .leftJoinAndSelect("project.members", "member")
        .leftJoinAndSelect("member.user", "user");

      if (userId) {
        queryBuilder.andWhere(
          "project.id IN (SELECT \"projectId\" FROM project_members WHERE \"userId\" = :userId)",
          { userId }
        );
      }

      if (options.name) {
        queryBuilder.andWhere("LOWER(project.name) LIKE :name", {
          name: `%${options.name.toLowerCase()}%`,
        });
      }

      if (options.keyPrefix) {
        queryBuilder.andWhere("project.keyPrefix LIKE :keyPrefix", {
          keyPrefix: `%${options.keyPrefix}%`,
        });
      }

      (Object.keys(options) as Array<keyof FindProjectOptions>).forEach(
        (key) => {
          if (key !== "name" && key !== "keyPrefix") {
            queryBuilder.andWhere(`project.${key} = :${key}`, {
              [key]: options[key],
            });
          }
        }
      );

      const result = await queryBuilder.getMany();
      return result;
    } catch (error) {
      throw getDBError(error);
    }
  }
}
