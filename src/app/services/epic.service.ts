import { injectable, inject } from "tsyringe";
import { IEpicRepo } from "../../domain/IRepos/IEpicRepo";
import { Epic } from "../../domain/entities";
import {
  CreateEpicDto,
  UpdateEpicDto,
  EpicResponseDto,
} from "../../domain/DTOs/epicDTO";
import { UserError } from "../exceptions";

@injectable()
export class EpicService {
  constructor(@inject("IEpicRepo") private epicRepo: IEpicRepo) {}

  async get(projectId: string): Promise<EpicResponseDto[]> {
    const epics = await this.epicRepo.get(projectId);
    return epics.map((epic) => new EpicResponseDto(epic));
  }

  async getById(id: string): Promise<EpicResponseDto> {
    const epic = await this.epicRepo.getById(id);
    if (!epic) {
      throw new UserError([`Epic with ID ${id} not found`], 404);
    }
    return new EpicResponseDto(epic);
  }

  async getByKey(key: string, projectId: string): Promise<EpicResponseDto> {
    const epics = await this.epicRepo.find({ key, projectId });
    if (epics.length === 0) {
      throw new UserError(
        [`Epic with key ${key} not found in project ${projectId}`],
        404,
      );
    }
    return new EpicResponseDto(epics[0]);
  }
  async create(dto: CreateEpicDto): Promise<EpicResponseDto> {
    const newEpic = await this.epicRepo.create(dto);
    return new EpicResponseDto(newEpic);
  }

  async update(id: string, dto: UpdateEpicDto): Promise<EpicResponseDto> {
    const updatedEpic = await this.epicRepo.update(id, dto);
    if (!updatedEpic) {
      throw new UserError([`Epic with ID ${id} not found`], 404);
    }
    return new EpicResponseDto(updatedEpic);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.epicRepo.delete(id);
    if (!result) {
      throw new UserError([`Cannot find an epic with id ${id}`], 404);
    }
    return result;
  }

  async getEpicIssues(epicId: string) {
    // You may want to use an IssueRepo for better separation, but here we use the Epic entity's relation
    const epic = await this.epicRepo.getById(epicId);
    if (!epic) {
      throw new UserError([`Epic with ID ${epicId} not found`], 404);
    }
    // Assumes epic.issues is loaded (see getById in EpicRepo)
    return epic.issues || [];
  }
}
