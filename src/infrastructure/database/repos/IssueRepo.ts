import { In, Repository } from "typeorm";
import { Issue } from "../../../domain/entities/issue.entity";
import { IIssueRepo } from "../../../domain/IRepos/IIssueRepo";
import { IssueType } from "../../../domain/types";
import { AppDataSource } from "../data-source";
import { FindIssueQueryOptions } from "../../../domain/option/issueQueryOptions"; // Only import FindIssueQueryOptions

export class IssueRepo implements IIssueRepo {
  private repo: Repository<Issue>;

  constructor() {
    this.repo = AppDataSource.getRepository(Issue);
  }

  async create(issueData: Partial<Issue>): Promise<Issue> {
    // Always remove id to force new insert
    if ('id' in issueData) {
      delete issueData.id;
    }
    const issue = this.repo.create(issueData);
    return await this.repo.save(issue);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected !== 0 && result.affected !== null;
  }

  // Consolidated get and find into a single find method
  async find(
    options?: FindIssueQueryOptions // Use the imported interface
  ): Promise<{ issues: Issue[]; total: number }> {
    const query = this.repo.createQueryBuilder("issue")
      .leftJoinAndSelect("issue.status", "status")
      .leftJoinAndSelect("issue.assigneeUser", "assigneeUser")
      .leftJoinAndSelect("issue.sprint", "sprint")
      .leftJoinAndSelect("issue.epic", "epic");    // Build WHERE conditions with simple, clear logic
    let hasWhere = false;

    if (options?.projectId) {
      query.where("issue.projectId = :projectId", { projectId: options.projectId });
      hasWhere = true;
    }
    
    if (options?.sprintId) {
      if (hasWhere) {
        query.andWhere("issue.sprintId = :sprintId", { sprintId: options.sprintId });
      } else {
        query.where("issue.sprintId = :sprintId", { sprintId: options.sprintId });
        hasWhere = true;
      }
    }
    
    if (options?.assignee) {
      if (hasWhere) {
        query.andWhere("issue.assignee = :assignee", { assignee: options.assignee });
      } else {
        query.where("issue.assignee = :assignee", { assignee: options.assignee });
        hasWhere = true;
      }
    }
    
    if (options?.statusId) {
      if (hasWhere) {
        query.andWhere("issue.statusId = :statusId", { statusId: options.statusId });
      } else {
        query.where("issue.statusId = :statusId", { statusId: options.statusId });
        hasWhere = true;
      }
    }
    
    if (options?.epicId) {
      if (hasWhere) {
        query.andWhere("issue.epicId = :epicId", { epicId: options.epicId });
      } else {
        query.where("issue.epicId = :epicId", { epicId: options.epicId });
        hasWhere = true;
      }
    }
    
    if (options?.type) {
      if (hasWhere) {
        query.andWhere("issue.type = :type", { type: options.type });
      } else {
        query.where("issue.type = :type", { type: options.type });
        hasWhere = true;
      }
    }
      if (options?.priority !== undefined) {
      if (hasWhere) {
        query.andWhere("issue.issuePriority = :priority", { priority: options.priority });
      } else {
        query.where("issue.issuePriority = :priority", { priority: options.priority });
        hasWhere = true;
      }
    }

    // Get total count
    const total = await query.getCount();
    
    // Select all necessary fields for the frontend (including sprintId, statusId, assignee, epicId, description)
    query.select([
      "issue.id",
      "issue.key",
      "issue.title",
      "issue.description",
      "issue.storyPoint",
      "issue.type",
      "issue.issuePriority",
      "issue.statusId",
      "issue.assignee",
      "issue.sprintId",
      "issue.epicId",
      "issue.projectId",
      "status.id",
      "status.name",
      "status.type",
      "assigneeUser.id",
      "assigneeUser.fullName",
      "assigneeUser.email",
      "assigneeUser.image",
      "sprint.id",
      "sprint.name",
      "sprint.startDate",
      "sprint.endDate",
      "epic.id",
      "epic.key",
      "epic.title",
      "epic.description"
    ]);

    const issues = await query.getMany();
    return { issues, total };
  }

  // Renamed from findFullById to getById
  async getById(id: string): Promise<Issue | null> {
    return await this.repo.findOne({
      where: { id },
      relations: [
        "assigneeUser",
        "project",
        "status",
        "sprint",
        "epic",
        // Removed outgoingRelations and incomingRelations as per the change request
      ],
    });
  }

  // Renamed from findByKey to getByKey
  async getByKey(key: string): Promise<Issue | null> {
    return await this.repo.findOne({ where: { key } });
  }

  async update(id: string, updateData: Partial<Issue>): Promise<Issue | null> {
    console.log("🔧 IssueRepo.update called with:", { id, updateData });
    
    // Log sprintId specifically since that's what we're tracking
    if (updateData.sprintId !== undefined) {
      console.log("💾 Updating sprintId to:", updateData.sprintId);
    }
    
    // Get the existing issue first
    const existingIssue = await this.repo.findOne({ where: { id } });
    if (!existingIssue) {
      console.error("❌ Issue not found:", id);
      return null;
    }

    // Merge the updates into the existing issue
    const mergedIssue = this.repo.merge(existingIssue, updateData);
    
    console.log("📝 Merged issue:", { id: mergedIssue.id, sprintId: mergedIssue.sprintId });

    // Save the merged issue (this ensures all relations and fields are properly persisted)
    const savedIssue = await this.repo.save(mergedIssue);
    
    console.log("✅ Issue saved to database with sprintId:", savedIssue.sprintId);

    // Fetch the complete issue with all relations
    const fullIssue = await this.getById(id);
    
    if (fullIssue) {
      console.log("✅ Retrieved full issue from DB with sprintId:", fullIssue.sprintId);
    }
    
    return fullIssue;
  }

  async generateIssueKey(projectId: string): Promise<string> {
    // Find the project prefix (e.g., from project entity or a config)
    const project = await AppDataSource.getRepository("Project").findOne({ where: { id: projectId } });
    // Use project.keyPrefix if available, otherwise fallback to projectId substring
    const prefix = project?.keyPrefix || projectId.substring(0, 3).toUpperCase();
    
    const lastIssue = await this.repo.createQueryBuilder("issue")
        .where("issue.projectId = :projectId", { projectId })
        .orderBy("issue.createdAt", "DESC") // Assuming key generation is sequential
        .select("issue.key", "issue_key") // Explicitly alias to ensure consistent raw result
        .getRawOne();

    let nextNumber = 1;
    if (lastIssue && lastIssue.issue_key) { // Access aliased column
        const parts = lastIssue.issue_key.split('-'); // Use aliased column
        if (parts.length > 1) {
            const lastNumber = parseInt(parts[parts.length -1], 10);
            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
            }
        }
    }
    return `${prefix}-${nextNumber}`;
  }

  // async getIssueCount(projectId: string): Promise<number> {
  //   return this.ormRepo.count({ where: { project: { id: projectId } } });
  // }

  async findById(id: string): Promise<Issue | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Issue[]> {
    return await this.repo.findBy({ id: In(ids) });
  }
}
