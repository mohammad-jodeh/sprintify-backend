import { injectable } from "tsyringe";
import { ISprintRepo, FindSprintOptions } from "../../../domain/IRepos/ISprintRepo";
import { AppDataSource } from "../data-source";
import { Sprint } from "../../../domain/entities";
import { CreateSprintDto, UpdateSprintDto } from "../../../domain/DTOs/sprintDTO";
import { getDBError } from "../utils/handleDBErrors";
import { UserError } from "../../../app/exceptions";
import { Repository } from "typeorm";

/**
 * Repository implementation for managing sprint data persistence
 */
@injectable()
export class SprintRepo implements ISprintRepo {
  private _sprintRepo: Repository<Sprint>;

  /**
   * Creates a new SprintRepo instance
   */
  constructor() {
    this._sprintRepo = AppDataSource.getRepository(Sprint);
  }

  /**
   * Creates a new sprint
   * @param data - The sprint creation data
   * @returns Promise<Sprint> - The created sprint
   * @throws ServerError - If database operation fails
   */
  async create(data: CreateSprintDto): Promise<Sprint> {
    try {
      const sprint = this._sprintRepo.create(data);
      return await this._sprintRepo.save(sprint);
    } catch (error) {
      throw getDBError(error);
    }
  }

  /**
   * Updates an existing sprint
   * @param data - The sprint update data
   * @returns Promise<Sprint> - The updated sprint
   * @throws UserError - If sprint not found
   * @throws ServerError - If database operation fails
   */
  async update(data: UpdateSprintDto): Promise<Sprint> {
    try {
      const result = await this._sprintRepo.update(data.id, data);
      if (result.affected === 0) {
        throw new UserError("Sprint not found or no changes made.", 404);
      }
      
      const updatedSprint = await this._sprintRepo.findOne({ where: { id: data.id } });
      if (!updatedSprint) {
        throw new UserError("Sprint not found after update.", 404);
      }
      
      return updatedSprint;
    } catch (error) {
      throw getDBError(error);
    }
  }

  /**
   * Deletes a sprint
   * @param id - The sprint ID
   * @returns Promise<boolean> - Whether the deletion was successful
   * @throws UserError - If sprint not found
   * @throws ServerError - If database operation fails
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this._sprintRepo.delete(id);
      if (result.affected === 0) {
        throw new UserError("Sprint not found", 404);
      }
      return true;
    } catch (error) {
      throw getDBError(error);
    }
  }

  /**
   * Finds a sprint by ID
   * @param id - The sprint ID
   * @returns Promise<Sprint | null> - The sprint or null if not found
   * @throws ServerError - If database operation fails
   */
  async findById(id: string): Promise<Sprint | null> {
    try {
      return await this._sprintRepo.findOne({ 
        where: { id },
        relations: ["project"] 
      });
    } catch (error) {
      throw getDBError(error);
    }
  }

  /**
   * Finds sprints based on options
   * @param options - The search options
   * @returns Promise<Sprint[]> - Array of sprints
   * @throws ServerError - If database operation fails
   */
  async find(options: FindSprintOptions): Promise<Sprint[]> {
    try {
      const queryBuilder = this._sprintRepo.createQueryBuilder("sprint");
      
      if (options.projectId) {
        queryBuilder.andWhere("sprint.projectId = :projectId", {
          projectId: options.projectId,
        });
      }

      if (options.id) {
        queryBuilder.andWhere("sprint.id = :id", { id: options.id });
      }

      queryBuilder.orderBy("sprint.startDate", "DESC");
      
      return await queryBuilder.getMany();
    } catch (error) {
      throw getDBError(error);
    }
  }
}
