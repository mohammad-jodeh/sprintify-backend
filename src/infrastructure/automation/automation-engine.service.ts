import { AppDataSource } from "../database/data-source";
import { AutomationRule } from "../../domain/entities";
import { Issue, Status } from "../../domain/entities";
import { CacheService } from "../cache/cache.service";

/**
 * Automation Engine Service
 * Executes automation rules based on triggers
 */
export class AutomationEngineService {
  private ruleRepository = AppDataSource.getRepository(AutomationRule);
  private issueRepository = AppDataSource.getRepository(Issue);
  private statusRepository = AppDataSource.getRepository(Status);
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
        console.log(`⏭️ Skipped rule "${rule.name}" - condition did not match`);
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
      
      // Match by name (condition stores names)
      return (
        (previousStatusName === condition.fromStatus || previousStatusId === condition.fromStatus) &&
        (currentStatusName === condition.toStatus || currentStatusId === condition.toStatus)
      );
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
    const { message, recipients } = payload;
    const { issueId, issueName } = data;

    if (!recipients || recipients.length === 0) return;

    try {
      console.log(`📧 Sending notifications to ${recipients.length} users`);
      console.log(`   Message: "${message}"`);
      console.log(`   Issue: ${issueName} (${issueId})`);

      // In production, integrate with notification service
      // For now, just log it
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
    const { userId } = payload;

    if (!issueId || !userId) return;

    try {
      await this.issueRepository.update(issueId, {
        assignee: userId,
      });
      console.log(`✅ Auto-assigned issue ${issueId} to user ${userId}`);
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
