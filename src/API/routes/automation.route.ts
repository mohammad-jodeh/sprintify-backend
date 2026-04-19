import { Request, Response } from "express";
import { BaseRoute } from "./base.route";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";
import { AutomationRuleRepository } from "../../infrastructure/database/repos/automation-rule.repo";
import { AutomationEngineService } from "../../infrastructure/automation/automation-engine.service";
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from "../../domain/DTOs/automation-rule.dto";

export class AutomationRoutes extends BaseRoute {
  public path = "/projects";
  private ruleRepository = new AutomationRuleRepository();
  private automationEngine = new AutomationEngineService();

  protected initRoutes(): void {
    this.router.get("/:projectId/automation-rules", authenticate, authorizeProjectAccess, this.listRules.bind(this));
    this.router.get("/:projectId/automation-rules/:ruleId", authenticate, authorizeProjectAccess, this.getRule.bind(this));
    this.router.post("/:projectId/automation-rules", authenticate, authorizeProjectAccess, this.createRule.bind(this));
    this.router.patch("/:projectId/automation-rules/:ruleId", authenticate, authorizeProjectAccess, this.updateRule.bind(this));
    this.router.delete("/:projectId/automation-rules/:ruleId", authenticate, authorizeProjectAccess, this.deleteRule.bind(this));
    this.router.patch("/:projectId/automation-rules/:ruleId/toggle", authenticate, authorizeProjectAccess, this.toggleRule.bind(this));
    this.router.get("/:projectId/automation-rules-stats", authenticate, authorizeProjectAccess, this.getStats.bind(this));
  }

  private async listRules(req: Request, res: Response): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const rules = await this.ruleRepository.findByProjectId(projectId);
      res.json({ message: "Automation rules retrieved", data: rules });
    } catch (error) {
      res.status(500).json({ error: "Error fetching automation rules", details: error });
    }
  }

  private async getRule(req: Request, res: Response): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      const rule = await this.ruleRepository.findById(ruleId);
      if (!rule) {
        res.status(404).json({ error: "Rule not found" });
        return;
      }
      res.json({ message: "Automation rule retrieved", data: rule });
    } catch (error) {
      res.status(500).json({ error: "Error fetching automation rule", details: error });
    }
  }

  private async createRule(req: Request, res: Response): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const { name, description, triggerType, triggerCondition, actionType, actionPayload } = req.body as CreateAutomationRuleDto;
      const userId = (req as any).user?.id;

      if (!name || !triggerType || !actionType) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const rule = await this.ruleRepository.create({
        projectId,
        createdById: userId,
        name,
        description,
        triggerType,
        triggerCondition: triggerCondition || {},
        actionType,
        actionPayload: actionPayload || {},
      });

      console.log(`✅ Created automation rule: ${name}`);
      res.status(201).json({ message: "Automation rule created", data: rule });
    } catch (error) {
      res.status(500).json({ error: "Error creating automation rule", details: error });
    }
  }

  private async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      const updates = req.body as UpdateAutomationRuleDto;
      const rule = await this.ruleRepository.update(ruleId, updates as any);
      console.log(`✅ Updated automation rule: ${rule.name}`);
      res.json({ message: "Automation rule updated", data: rule });
    } catch (error) {
      res.status(500).json({ error: "Error updating automation rule", details: error });
    }
  }

  private async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      await this.ruleRepository.delete(ruleId);
      console.log(`✅ Deleted automation rule: ${ruleId}`);
      res.json({ message: "Automation rule deleted" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting automation rule", details: error });
    }
  }

  private async toggleRule(req: Request, res: Response): Promise<void> {
    try {
      const ruleId = String(req.params.ruleId);
      const rule = await this.ruleRepository.toggleActive(ruleId);
      console.log(`✅ Toggled automation rule: ${rule.name} (active: ${rule.isActive})`);
      res.json({ message: "Automation rule toggled", data: rule });
    } catch (error) {
      res.status(500).json({ error: "Error toggling automation rule", details: error });
    }
  }

  private async getStats(req: Request, res: Response): Promise<void> {
    try {
      const projectId = String(req.params.projectId);
      const stats = await this.automationEngine.getStats(projectId);
      res.json({ message: "Automation statistics", data: stats });
    } catch (error) {
      res.status(500).json({ error: "Error fetching automation stats", details: error });
    }
  }
}
