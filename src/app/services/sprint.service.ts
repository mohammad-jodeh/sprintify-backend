import { inject, injectable } from "tsyringe";
import { ISprintRepo, FindSprintOptions } from "../../domain/IRepos/ISprintRepo";
import { Sprint } from "../../domain/entities";
import { CreateSprintDto, UpdateSprintDto } from "../../domain/DTOs/sprintDTO";
import { NotFoundException } from "../exceptions";

/**
 * Service for managing sprints
 */
@injectable()
export class SprintService {
  /**
   * Creates a new SprintService instance
   * @param sprintRepo - The sprint repository
   */
  constructor(@inject("ISprintRepo") private sprintRepo: ISprintRepo) {}

  /**
   * Creates a new sprint
   * @param data - The sprint data
   * @returns The created sprint
   */
  async create(data: CreateSprintDto): Promise<Sprint> {
    return await this.sprintRepo.create(data);
  }

  /**
   * Updates an existing sprint
   * @param data - The updated sprint data
   * @returns The updated sprint
   * @throws NotFoundException if sprint not found
   */
  async update(data: UpdateSprintDto): Promise<Sprint> {
    const existingSprint = await this.sprintRepo.findById(data.id);
    if (!existingSprint) {
      throw new NotFoundException("Sprint not found");
    }
    return await this.sprintRepo.update(data);
  }

  /**
   * Deletes a sprint
   * @param id - The sprint ID
   * @returns Whether the deletion was successful
   * @throws NotFoundException if sprint not found
   */
  async delete(id: string): Promise<boolean> {
    const existingSprint = await this.sprintRepo.findById(id);
    if (!existingSprint) {
      throw new NotFoundException("Sprint not found");
    }
    return await this.sprintRepo.delete(id);
  }

  /**
   * Finds a sprint by ID
   * @param id - The sprint ID
   * @returns The sprint
   * @throws NotFoundException if sprint not found
   */
  async findById(id: string): Promise<Sprint> {
    const sprint = await this.sprintRepo.findById(id);
    if (!sprint) {
      throw new NotFoundException("Sprint not found");
    }
    return sprint;
  }

  /**
   * Finds sprints based on options
   * @param options - The search options
   * @returns Array of sprints
   */
  async find(options: FindSprintOptions): Promise<Sprint[]> {
    return await this.sprintRepo.find(options);
  }
}
