import { inject, injectable } from "tsyringe";
import { IProjectMemberRepo } from "../../domain/IRepos/IProjectMemberRepo";
import { IProjectRepo } from "../../domain/IRepos/IProjectRepo";
import {
  CreateProjectMemberDto,
  UpdateProjectMemberDto,
} from "../../domain/DTOs/projectMemberDTO";
import { NotificationService } from "./notification.service";
import { NotificationType, NotificationPriority } from "../../domain/types/enums";

@injectable()
export class ProjectMembersService {
  constructor(
    @inject("IProjectMemberRepo") private repo: IProjectMemberRepo,
    @inject("IProjectRepo") private projectRepo: IProjectRepo,
    private notificationService: NotificationService
  ) {}

  async add(newMembership: CreateProjectMemberDto) {
    const membership = await this.repo.add(newMembership);
    
    // Send notification to new member
    try {
      const projects = await this.projectRepo.find({ } as any);
      const project = projects?.find(p => p.id === newMembership.projectId);
      if (project) {
        await this.notificationService.create({
          title: `Added to Project: ${project.name}`,
          message: `You have been added to the "${project.name}" project`,
          type: NotificationType.PROJECT_UPDATED,
          priority: NotificationPriority.MEDIUM,
          recipientId: newMembership.userId,
          // senderId is optional; omit it for system-generated notifications.
          metadata: {
            projectId: newMembership.projectId,
            membershipId: membership.id,
            actorType: "system",
          },
          actionUrl: `/projects/${newMembership.projectId}`,
        });
      }
    } catch (error) {
      console.error("Failed to send project join notification:", error);
      // Don't throw - notification failure shouldn't break the membership creation
    }
    
    return membership;
  }

  async update(membership: UpdateProjectMemberDto) {
    return this.repo.update(membership);
  }

  async remove(membershipId: string): Promise<void> {
    await this.repo.remove(membershipId);
  }
  
  async find(where: Partial<CreateProjectMemberDto>) {
    return this.repo.find(where);
  }
}
