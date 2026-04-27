import { injectable, inject } from "tsyringe";
import { plainToInstance } from "class-transformer"; // Added import
import { 
  CreateIssueDto, 
  UpdateIssueDto, 
  IssuePartialResponseDto, 
  IssueFullResponseDto 
} from "../../domain/DTOs/issueDTO";
import { IIssueRepo } from "../../domain/IRepos/IIssueRepo";
import { IUserRepo } from "../../domain/IRepos/IUserRepo";
import { Issue } from "../../domain/entities";
import { ServerError, NotFoundException } from "../exceptions"; 
import { FindIssueQueryOptions } from "../../domain/option/issueQueryOptions"; 
import { NotificationService } from "./notification.service";
import { NotificationType, NotificationPriority } from "../../domain/types/enums";
import { SocketService } from "../../infrastructure/socket/socket.service";

@injectable()
export class IssueService {
  constructor(
    @inject("IIssueRepo") private issueRepo: IIssueRepo,
    @inject("IUserRepo") private userRepo: IUserRepo,
    private notificationService: NotificationService,
    private socketService: SocketService
  ) {}

  async create(userId: string, createIssueDto: CreateIssueDto): Promise<IssueFullResponseDto> {    
    const key = await this.issueRepo.generateIssueKey(createIssueDto.projectId);

    const issueData: Partial<Issue> = {
      ...createIssueDto,
      key,
    };

    const issue = await this.issueRepo.create(issueData);
    const fullIssue = await this.issueRepo.getById(issue.id); 
    
    if (!fullIssue) {
      throw new ServerError("Failed to create issue"); 
    }

    // ===== EMIT REAL-TIME SOCKET EVENT =====
    try {
      const issueResponse = plainToInstance(IssueFullResponseDto, fullIssue, { excludeExtraneousValues: true });
      this.socketService.emitToProject(createIssueDto.projectId, "issue:created", {
        issue: issueResponse,
        createdBy: userId,
      });
      console.log(`📨 Emitted issue:created for issue ${key} to project ${createIssueDto.projectId}`);
    } catch (error) {
      console.error("Failed to emit real-time notification:", error);
      // Don't throw - socket failure shouldn't break the create
    }
    // ===== END SOCKET EVENT =====

    return plainToInstance(IssueFullResponseDto, fullIssue, { excludeExtraneousValues: true });
  }

  async getAll( 
    userId: string,
    projectId: string,
    options?: FindIssueQueryOptions 
  ): Promise<{ issues: IssuePartialResponseDto[]; total: number }> { 
    const findOptions: FindIssueQueryOptions = { 
      ...options,
      projectId: projectId, 
    };

    const { issues, total } = await this.issueRepo.find(findOptions); 

    return {
      issues: issues.map(issue => plainToInstance(IssuePartialResponseDto, issue, { excludeExtraneousValues: true })),
      total,
    };
  }

  async getById(userId: string, issueId: string): Promise<IssueFullResponseDto> { 
    const issue = await this.issueRepo.getById(issueId); 
    if (!issue) {
      throw new NotFoundException("Issue not found");
    }

    return plainToInstance(IssueFullResponseDto, issue, { excludeExtraneousValues: true });
  }

  async getByKey(userId: string, key: string): Promise<IssueFullResponseDto> { 
    const issue = await this.issueRepo.getByKey(key); 
    if (!issue) {
      throw new NotFoundException("Issue not found");
    }

    const fullIssue = await this.issueRepo.getById(issue.id); 
    if (!fullIssue) { 
        throw new ServerError("Failed to retrieve full issue details after finding by key.");
    }
    return plainToInstance(IssueFullResponseDto, fullIssue, { excludeExtraneousValues: true });
  }

  async update( 
    userId: string, 
    issueId: string, 
    updateIssueDto: UpdateIssueDto
  ): Promise<IssueFullResponseDto> {
    const existingIssue = await this.issueRepo.getById(issueId); 
    if (!existingIssue) {
      throw new NotFoundException("Issue not found");
    }

    // Store previous values to detect specific changes
    const previousAssignee = existingIssue.assignee;
    const previousStatusId = existingIssue.statusId;

    const updatedIssue = await this.issueRepo.update(issueId, updateIssueDto);
    if (!updatedIssue) {
      throw new ServerError("Failed to update issue"); 
    }

    // Reload the issue to get full details for socket events
    const fullUpdatedIssue = await this.issueRepo.getById(issueId);
    
    // ===== EMIT REAL-TIME SOCKET EVENTS =====
    try {
      const projectId = updatedIssue.projectId;
      
      // Emit general update event with full issue object
      this.socketService.emitToProject(projectId, "issue:updated", {
        issue: plainToInstance(IssueFullResponseDto, fullUpdatedIssue, { excludeExtraneousValues: true }),
        updatedBy: userId,
      });
      console.log(`📨 Emitted issue:updated for issue ${updatedIssue.key}`);

      // Emit status change event if status changed
      if (updateIssueDto.statusId && updateIssueDto.statusId !== previousStatusId) {
        this.socketService.emitToProject(projectId, "issue:status-changed", {
          issue: plainToInstance(IssueFullResponseDto, fullUpdatedIssue, { excludeExtraneousValues: true }),
          previousStatusId: previousStatusId,
          changedBy: userId,
        });
        console.log(`📨 Emitted issue:status-changed for issue ${updatedIssue.key}`);
      }

      // Emit assignment change event if assignee changed
      if (updateIssueDto.assignee && updateIssueDto.assignee !== previousAssignee) {
        this.socketService.emitToProject(projectId, "issue:assigned", {
          issue: plainToInstance(IssueFullResponseDto, fullUpdatedIssue, { excludeExtraneousValues: true }),
          previousAssignee: previousAssignee,
          assignedBy: userId,
        });
        console.log(`📨 Emitted issue:assigned for issue ${updatedIssue.key}`);
      }
    } catch (error) {
      console.error("Failed to emit real-time notification:", error);
      // Don't throw - socket failure shouldn't break the update
    }
    // ===== END SOCKET EVENTS =====

    // Send notification if assignee changed
    if (updateIssueDto.assignee && updateIssueDto.assignee !== previousAssignee) {
      try {
        await this.notificationService.create({
          title: `Issue Assigned: ${updatedIssue.key}`,
          message: `You have been assigned to "${updatedIssue.title}"`,
          type: NotificationType.ISSUE_UPDATED,
          priority: NotificationPriority.HIGH,
          recipientId: updateIssueDto.assignee,
          senderId: userId,
          metadata: {
            issueId: issueId,
            projectId: updatedIssue.projectId,
          },
          actionUrl: `/projects/${updatedIssue.projectId}/board`,
        });
      } catch (error) {
        console.error("Failed to send assignment notification:", error);
        // Don't throw - notification failure shouldn't break the update
      }
    }

    return plainToInstance(IssueFullResponseDto, updatedIssue, { excludeExtraneousValues: true });
  }

  async delete(userId: string, issueId: string): Promise<void> { 
    const issue = await this.issueRepo.getById(issueId);
    if (!issue) {
      throw new NotFoundException("Issue not found");
    }

    const deleted = await this.issueRepo.delete(issueId);
    if (!deleted) {
      throw new NotFoundException("Issue not found");
    }

    // ===== EMIT REAL-TIME SOCKET EVENT =====
    try {
      this.socketService.emitToProject(issue.projectId, "issue:deleted", {
        issueId: issueId,
        key: issue.key,
        title: issue.title,
        projectId: issue.projectId,
        deletedBy: userId,
      });
      console.log(`📨 Emitted issue:deleted for issue ${issue.key}`);
    } catch (error) {
      console.error("Failed to emit real-time notification:", error);
      // Don't throw - socket failure shouldn't break the delete
    }
    // ===== END SOCKET EVENT =====
  }

  async getMyAssigned( 
    userId: string, 
    projectId?: string,
    options?: FindIssueQueryOptions 
  ): Promise<IssuePartialResponseDto[]> {
    const findOptions = {
      ...options,
      assignee: userId,
      projectId: projectId, 
    };
    const { issues } = await this.issueRepo.find(findOptions); 
    return issues.map(issue => plainToInstance(IssuePartialResponseDto, issue, { excludeExtraneousValues: true }));
  }
  async getAssignedToUser(
    requestUserId: string,
    assigneeUserId: string,
    projectId?: string,
    options?: FindIssueQueryOptions
  ): Promise<IssuePartialResponseDto[]> {
    // Verify the assignee user exists
    const assigneeUser = await this.userRepo.findById(assigneeUserId);
    if (!assigneeUser) {
      throw new NotFoundException("Assignee user not found");
    }

    const findOptions = {
      ...options,
      assignee: assigneeUserId,
      projectId: projectId,
    };
    const { issues } = await this.issueRepo.find(findOptions);
    return issues.map(issue => plainToInstance(IssuePartialResponseDto, issue, { excludeExtraneousValues: true }));
  }

  async getBySprint( 
    userId: string, 
    sprintId: string,
    options?: FindIssueQueryOptions 
  ): Promise<IssuePartialResponseDto[]> {
    const findOptions = {
      ...options,
      sprintId: sprintId,
    };
    const { issues } = await this.issueRepo.find(findOptions); 
    return issues.map(issue => plainToInstance(IssuePartialResponseDto, issue, { excludeExtraneousValues: true }));
  }

  async getByEpic( 
    userId: string, 
    epicId: string,
    options?: FindIssueQueryOptions 
  ): Promise<IssuePartialResponseDto[]> {
    const findOptions = {
      ...options,
      epicId: epicId,
    };
    const { issues } = await this.issueRepo.find(findOptions); 
    return issues.map(issue => plainToInstance(IssuePartialResponseDto, issue, { excludeExtraneousValues: true }));
  }
}
