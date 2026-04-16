import { inject, injectable } from "tsyringe";
import { ISprintRepo, FindSprintOptions } from "../../domain/IRepos/ISprintRepo";
import { Sprint } from "../../domain/entities";
import { CreateSprintDto, UpdateSprintDto } from "../../domain/DTOs/sprintDTO";
import { NotFoundException } from "../exceptions";
import { SocketService } from "../../infrastructure/socket/socket.service";

/**
 * Service for managing sprints
 */
@injectable()
export class SprintService {
  /**
   * Creates a new SprintService instance
   * @param sprintRepo - The sprint repository
   * @param socketService - The socket service for real-time updates
   */
  constructor(
    @inject("ISprintRepo") private sprintRepo: ISprintRepo,
    private socketService: SocketService
  ) {}

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
    const updatedSprint = await this.sprintRepo.update(data);

    // ===== EMIT REAL-TIME SOCKET EVENT =====
    try {
      this.socketService.emitToProject(updatedSprint.projectId, "sprint:updated", {
        id: updatedSprint.id,
        name: updatedSprint.name,
        startDate: updatedSprint.startDate,
        endDate: updatedSprint.endDate,
        archived: updatedSprint.archived,
        projectId: updatedSprint.projectId,
      });
      console.log(`📨 Emitted sprint:updated for sprint ${updatedSprint.name}`);
    } catch (error) {
      console.error("Failed to emit real-time notification:", error);
      // Don't throw - socket failure shouldn't break the update
    }
    // ===== END SOCKET EVENT =====

    return updatedSprint;
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
