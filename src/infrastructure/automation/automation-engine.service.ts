import { AppDataSource } from "../database/data-source";
import { AutomationRule } from "../../domain/entities";
import { Issue, ProjectMember, Status, User } from "../../domain/entities";
import { CacheService } from "../cache/cache.service";
import { Notification } from "../../domain/entities/notification.entity";
import { NotificationPriority, NotificationType } from "../../domain/types/enums";

/**
 * Automation Engine Service
 * Executes automation rules based on triggers
 */
export class AutomationEngineService {
  private ruleRepository = AppDataSource.getRepository(AutomationRule);
  private issueRepository = AppDataSource.getRepository(Issue);
  private statusRepository = AppDataSource.getRepository(Status);
  private userRepository = AppDataSource.getRepository(User);
  private projectMemberRepository = AppDataSource.getRepository(ProjectMember);
  private notificationRepository = AppDataSource.getRepository(Notification);
  private cache = CacheService.getInstance();

  /**
   * Trigger automation rules for a specific event
   */
  async triggerAutomations(
    projectId: string,
    triggerType: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      // Get active rules for this project
      const rules = await this.ruleRepository.find({
        where: {
          projectId,
          triggerType: triggerType as any,
          isActive: true,
        },
      });

      console.log(`🔄 Found ${rules.length} automation rules for trigger: ${triggerType}`);

      // Execute each matching rule
      for (const rule of rules) {
        await this.executeRule(rule, data);
      }
    } catch (error) {
      console.error("❌ Error triggering automations:", error);
    }
  }

  /**
   * Execute a single automation rule
   */
  private async executeRule(
    rule: AutomationRule,
    triggerData: Record<string, any>
  ): Promise<void> {
    try {
      // Check if trigger condition matches
      const matches = await this.matchesTriggerCondition(rule.triggerCondition, triggerData);
      if (!matches) {
        console.log(`⏭️ Skipped rule "${rule.name}" - condition did not match`, {
          triggerType: rule.triggerType,
          condition: rule.triggerCondition,
          triggerData,
        });
        return;
      }

      console.log(`✅ Executing automation rule: ${rule.name}`);

      // Execute action based on rule type
      switch (rule.actionType) {
        case "auto_transition":
          await this.executeAutoTransition(triggerData, rule.actionPayload);
          break;
        case "notify_user":
          await this.executeNotification(triggerData, rule.actionPayload);
          break;
        case "assign_user":
          await this.executeAutoAssign(triggerData, rule.actionPayload);
          break;
        case "add_comment":
          await this.executeAutoComment(triggerData, rule.actionPayload);
          break;
        case "send_webhook":
          await this.executeSendWebhook(rule.actionPayload, triggerData);
          break;
      }

      // Invalidate related caches
      this.cache.deletePattern(/issues:/);
    } catch (error) {
      console.error(`❌ Error executing automation rule ${rule.id}:`, error);
    }
  }

  /**
   * Check if trigger condition matches the data
   * Handles both status IDs and status names
   */
  private async matchesTriggerCondition(
    condition: Record<string, any>,
    data: Record<string, any>
  ): Promise<boolean> {
    // Status changed transition - check both by ID and by name
    if (condition.fromStatus && condition.toStatus) {
      const previousStatusId = data.previousStatus;
      const currentStatusId = data.currentStatus;
      
      // Get status names to support both ID and name matching
      let previousStatusName = data.previousStatusName;
      let currentStatusName = data.currentStatusName;
      
      // If names not provided, look them up from IDs
      if (!previousStatusName && previousStatusId) {
        const prevStatus = await this.statusRepository.findOne({
          where: { id: previousStatusId as any }
        });
        previousStatusName = prevStatus?.name;
      }
      
      if (!currentStatusName && currentStatusId) {
        const currStatus = await this.statusRepository.findOne({
          where: { id: currentStatusId as any }
        });
        currentStatusName = currStatus?.name;
      }
      
      const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

      const previousMatched =
        normalize(previousStatusName) === normalize(condition.fromStatus) ||
        normalize(previousStatusId) === normalize(condition.fromStatus);

      const currentMatched =
        normalize(currentStatusName) === normalize(condition.toStatus) ||
        normalize(currentStatusId) === normalize(condition.toStatus);

      return previousMatched && currentMatched;
    }

    // Specific status
    if (condition.statusId) {
      return data.statusId === condition.statusId;
    }

    // Priority filter
    if (condition.priority) {
      return data.priority === condition.priority;
    }

    return true; // No specific condition, always match
  }

  /**
   * Auto-transition issue to another status
   */
  private async executeAutoTransition(
    data: Record<string, any>,
    payload: Record<string, any>
  ): Promise<void> {
    const { issueId } = data;
    const { targetStatusId } = payload;

    if (!issueId || !targetStatusId) return;

    try {
      await this.issueRepository.update(issueId, {
        statusId: targetStatusId,
      });
      console.log(`✅ Auto-transitioned issue ${issueId} to status ${targetStatusId}`);
    } catch (error) {
      console.error("❌ Error auto-transitioning issue:", error);
    }
  }

  /**
   * Send notification
   */
  private async executeNotification(
    data: Record<string, any>,
    payload: Record<string, any>
  ): Promise<void> {
    const { message, recipients, recipientId } = payload;
    const { issueId, issueName, issueTitle, projectId } = data;

    const recipientIds = Array.isArray(recipients)
      ? recipients
      : recipientId
        ? [recipientId]
        : [];

    if (recipientIds.length === 0) {
      console.warn("⚠️ [AUTOMATION] notify_user skipped - no recipients configured");
      return;
    }

    try {
      const issueLabel = issueName || issueTitle || issueId;
      const content = message || `Automation triggered for issue ${issueLabel}`;

      for (const recipient of recipientIds) {
        await this.notificationRepository.save({
          title: `Automation: ${issueLabel}`,
          message: content,
          type: NotificationType.ISSUE_UPDATED,
          priority: NotificationPriority.MEDIUM,
          recipientId: recipient,
          metadata: {
            issueId,
            projectId,
            source: "automation",
          },
          actionUrl: projectId ? `/projects/${projectId}/board` : undefined,
        });
      }

      console.log(`✅ Automation notifications created for ${recipientIds.length} recipients`);
    } catch (error) {
      console.error("❌ Error sending notification:", error);
    }
  }

  /**
   * Auto-assign issue to user
   */
  private async executeAutoAssign(
    data: Record<string, any>,
    payload: Record<string, any>
  ): Promise<void> {
    const { issueId } = data;
    let { userId } = payload;

    if (!issueId || !userId) return;

    try {
      let targetUserId = userId;

      // Validate provided ID as a real user ID first.
      const existingUser = await this.userRepository.findOne({ where: { id: targetUserId } });

      // Backward compatibility: some old rules saved project_member.id instead of user.id.
      if (!existingUser) {
        const membership = await this.projectMemberRepository.findOne({ where: { id: userId } });
        if (membership?.userId) {
          targetUserId = membership.userId;
          console.warn(
            `⚠️ [AUTOMATION] assign_user payload used project_member id. Mapped ${userId} -> user ${targetUserId}`
          );
        }
      }

      const verifiedTargetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
      if (!verifiedTargetUser) {
        console.error(`❌ [AUTOMATION] assign_user target does not exist in users table: ${userId}`);
        return;
      }

      await this.issueRepository.update(issueId, {
        assignee: targetUserId,
      });
      console.log(`✅ Auto-assigned issue ${issueId} to user ${targetUserId}`);
    } catch (error) {
      console.error("❌ Error auto-assigning issue:", error);
    }
  }

  /**
   * Auto-add comment
   */
  private async executeAutoComment(
    data: Record<string, any>,
    payload: Record<string, any>
  ): Promise<void> {
    const { issueId } = data;
    const { message } = payload;

    if (!issueId || !message) return;

    try {
      console.log(`💬 Adding auto-comment to issue ${issueId}: "${message}"`);
      // TODO: Implement comment creation when comment entity is ready
    } catch (error) {
      console.error("❌ Error adding auto-comment:", error);
    }
  }

  /**
   * Send webhook to external service
   */
  private async executeSendWebhook(
    payload: Record<string, any>,
    triggerData: Record<string, any>
  ): Promise<void> {
    const { webhookUrl } = payload;

    if (!webhookUrl) return;

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger: triggerData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn(`⚠️  Webhook returned status ${response.status}`);
      } else {
        console.log(`✅ Webhook sent successfully to ${webhookUrl}`);
      }
    } catch (error) {
      console.error("❌ Error sending webhook:", error);
    }
  }

  /**
   * Get stats about automation rules
   */
  async getStats(projectId: string): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    const rules = await this.ruleRepository.find({
      where: { projectId },
    });

    const byType: Record<string, number> = {};
    rules.forEach((rule) => {
      byType[rule.actionType] = (byType[rule.actionType] || 0) + 1;
    });

    return {
      total: rules.length,
      active: rules.filter((r) => r.isActive).length,
      byType,
    };
  }
}

export default AutomationEngineService;
