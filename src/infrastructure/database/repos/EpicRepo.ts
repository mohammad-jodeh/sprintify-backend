import { injectable } from "tsyringe";
import { AppDataSource } from "../data-source";
import { Epic, Issue, Project } from "../../../domain/entities";
import { IEpicRepo } from "../../../domain/IRepos/IEpicRepo";

@injectable()
export class EpicRepo implements IEpicRepo {
  private _epicRepo;

  constructor() {
    this._epicRepo = AppDataSource.getRepository(Epic);
  }

  async get(projectId: string): Promise<Epic[]> {
    return await this._epicRepo.find({
      where: { projectId },
      relations: ["assigneeUser"],
    });
  }

  async getById(id: string): Promise<Epic | null> {
    return await this._epicRepo.findOne({
      where: { id },
      relations: ["assigneeUser", "issues"],
    });
  }

  async find(options: Partial<Epic>): Promise<Epic[]> {
    return await this._epicRepo.find({
      where: { projectId: options.projectId, ...options },
      relations: ["assigneeUser", "issues"],
    });
  }
  async create(epicData: Partial<Epic>): Promise<Epic> {
    try {
      // Always generate a new key automatically
      const key = await this.generateEpicKey(epicData.projectId!);

      const cleanEpicData = {
        ...epicData,
        key, // ensure key is included
      };
      
      const epic = this._epicRepo.create(cleanEpicData);
      const savedEpic = await this._epicRepo.save(epic);
      
      const fullEpic = await this.getById(savedEpic.id);
        return fullEpic || savedEpic;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, epicData: Partial<Epic>): Promise<Epic | null> {
    // Clean the data by only selecting the epic-specific fields for update
    const cleanEpicData: Partial<Epic> = { ...epicData }; // Use spread operator
    
    console.log('Updating epic with clean data:', cleanEpicData);

    const result = await this._epicRepo.update(id, cleanEpicData);

    if (!result.affected || result.affected === 0) {
      return null;
    }

    return await this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this._epicRepo.delete(id);
    return !!(result.affected && result.affected > 0); // Ensure boolean return and use &&
  }
  private async generateEpicKey(projectId: string): Promise<string> {
    const projectRepo = AppDataSource.getRepository(Project);
    const project = await projectRepo.findOne({ where: { id: projectId } });

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const epicRepo = AppDataSource.getRepository(Epic);
    const issueRepo = AppDataSource.getRepository(Issue);

    const [epics, issues] = await Promise.all([
      epicRepo.find({
        where: { projectId },
        select: ["key"],
      }),
      issueRepo.find({
        where: { projectId },
        select: ["key"],
      }),
    ]);

    const keyPrefix = project.keyPrefix;
    const keyPattern = new RegExp(`^${keyPrefix}-(\\d+)$`);

    let highestNumber = 0;

    [...epics, ...issues].forEach((item) => {
      const match = item.key.match(keyPattern);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    return `${keyPrefix}-${highestNumber + 1}`;
  }
}
