import { AppDataSource } from "../data-source";
import { AutomationRule } from "../../../domain/entities";

interface CreateRuleData {
  name: string;
  description?: string;
  projectId: string;
  createdById: string;
  triggerType: string;
  triggerCondition: Record<string, any>;
  actionType: string;
  actionPayload: Record<string, any>;
}

/**
 * Automation Rule Repository
 * Handles CRUD operations for automation rules
 */
export class AutomationRuleRepository {
  private repo = AppDataSource.getRepository(AutomationRule);

  /**
   * Create a new automation rule
   */
  async create(data: CreateRuleData): Promise<AutomationRule> {
    const rule = this.repo.create({
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      createdById: data.createdById,
      triggerType: data.triggerType as any,
      triggerCondition: data.triggerCondition,
      actionType: data.actionType as any,
      actionPayload: data.actionPayload,
    });
    return await this.repo.save(rule);
  }

  /**
   * Find all rules for a project
   */
  async findByProjectId(projectId: string): Promise<AutomationRule[]> {
    return await this.repo.find({
      where: { projectId },
      relations: ["createdBy"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Find active rules for a project
   */
  async findActiveByProjectId(projectId: string): Promise<AutomationRule[]> {
    return await this.repo.find({
      where: { projectId, isActive: true },
      relations: ["createdBy"],
    });
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<AutomationRule | null> {
    return await this.repo.findOne({
      where: { id },
      relations: ["createdBy", "project"],
    });
  }

  /**
   * Update rule
   */
  async update(
    id: string,
    data: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    await this.repo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Rule not found after update");
    }
    return updated;
  }

  /**
   * Delete rule
   */
  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  /**
   * Toggle rule active status
   */
  async toggleActive(id: string): Promise<AutomationRule> {
    const rule = await this.findById(id);
    if (!rule) {
      throw new Error("Rule not found");
    }
    return await this.update(id, { isActive: !rule.isActive });
  }

  /**
   * Get rules by trigger type
   */
  async findByTriggerType(
    projectId: string,
    triggerType: string
  ): Promise<AutomationRule[]> {
    return await this.repo.find({
      where: { projectId, triggerType: triggerType as any, isActive: true },
    });
  }

  /**
   * Count rules by action type
   */
  async countByActionType(projectId: string): Promise<Record<string, number>> {
    const rules = await this.findByProjectId(projectId);
    const counts: Record<string, number> = {};

    rules.forEach((rule) => {
      counts[rule.actionType] = (counts[rule.actionType] || 0) + 1;
    });

    return counts;
  }
}

export default AutomationRuleRepository;
