import { injectable } from "tsyringe";
import { IProjectMemberRepo } from "../../../domain/IRepos/IProjectMemberRepo";
import { AppDataSource } from "../data-source";
import { ProjectMember } from "../../../domain/entities";
import {
  CreateProjectMemberDto,
  UpdateProjectMemberDto,
} from "../../../domain/DTOs/projectMemberDTO";
import { getDBError } from "../utils/handleDBErrors";
import { ServerError, UserError } from "../../../app/exceptions";
import { FindProjectMemberOptions } from "../../../domain/types";

@injectable()
export class ProjectMemberRepo implements IProjectMemberRepo {
  private _projectMemberRepo;

  constructor() {
    try {
      this._projectMemberRepo = AppDataSource.getRepository(ProjectMember);
    } catch (error) {
      throw new ServerError("Cannot get project member repository", 500);
    }
  }

  async add(dto: CreateProjectMemberDto): Promise<ProjectMember> {
    try {
      const projectMember = this._projectMemberRepo.create(dto);
      return await this._projectMemberRepo.save(projectMember);
    } catch (error) {
      throw getDBError(error);
    }
  }

  async update(dto: UpdateProjectMemberDto): Promise<ProjectMember> {
    try {
      const where = { userId: dto.userId, projectId: dto.projectId };
      const res = await this._projectMemberRepo.update(where, dto);
      if (res.affected === 0) {
        throw new UserError("Project not found or no changes made.", 404);
      }

      return await this._projectMemberRepo.findOneOrFail({ where });
    } catch (error) {
      throw getDBError(error);
    }
  }

  async remove(membershipId: string): Promise<void> {
    try {
      await this._projectMemberRepo.delete(membershipId);
    } catch (error) {
      throw getDBError(error);
    }
  }

  async find(where: FindProjectMemberOptions): Promise<ProjectMember[]> {
    try {
      return await this._projectMemberRepo.find({
        where,
        relations: ["user", "project"],
      });
    } catch (error) {
      throw getDBError(error);
    }
  }
}
