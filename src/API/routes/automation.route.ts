import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeProjectAccess } from "../middlewares/authorize-project.middleware";
import { AutomationRuleRepository } from "../../infrastructure/database/repos/automation-rule.repo";
import { AutomationEngineService } from "../../infrastructure/automation/automation-engine.service";
import { CreateAutomationRuleDto, UpdateAutomationRuleDto } from "../../domain/DTOs/automation-rule.dto";

const router = Router();
const ruleRepository = new AutomationRuleRepository();
const automationEngine = new AutomationEngineService();

/**
 * GET /api/v1/projects/:projectId/automation-rules
 * Get all automation rules for a project
 */
router.get(
  "/:projectId/automation-rules",
  authenticate,
  authorizeProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const rules = await ruleRepository.findByProjectId(projectId);

      return res.json({
        message: "Automation rules retrieved",
        data: rules,
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching automation rules", details: error });
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/automation-rules/:ruleId
 * Get single automation rule
 */
router.get(
  "/:projectId/automation-rules/:ruleId",
  authenticate,
  authorizeProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const ruleId = String(req.params.ruleId);
      const rule = await ruleRepository.findById(ruleId);

      if (!rule) {
        return res.status(404).json({ error: "Rule not found" });
      }

      return res.json({
        message: "Automation rule retrieved",
        data: rule,
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching automation rule", details: error });
    }
  }
);

/**
 * POST /api/v1/projects/:projectId/automation-rules
 * Create new automation rule
 */
router.post(
  "/:projectId/automation-rules",
  authenticate,
  authorizeProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const { name, description, triggerType, triggerCondition, actionType, actionPayload } =
        req.body as CreateAutomationRuleDto;

      const userId = (req as any).user?.id;

      if (!name || !triggerType || !actionType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const rule = await ruleRepository.create({
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

      return res.status(201).json({
        message: "Automation rule created",
        data: rule,
      });
    } catch (error) {
      res.status(500).json({ error: "Error creating automation rule", details: error });
    }
  }
);

/**
 * PATCH /api/v1/projects/:projectId/automation-rules/:ruleId
 * Update automation rule
 */
router.patch(
  "/:projectId/automation-rules/:ruleId",
  authenticate,
  authorizeProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const ruleId = String(req.params.ruleId);
      const updates = req.body as UpdateAutomationRuleDto;

      const rule = await ruleRepository.update(ruleId, updates as any);

      console.log(`✅ Updated automation rule: ${rule.name}`);

      return res.json({
        message: "Automation rule updated",
        data: rule,
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating automation rule", details: error });
    }
  }
);

/**
 * DELETE /api/v1/projects/:projectId/automation-rules/:ruleId
 * Delete automation rule
 */
router.delete(
  "/:projectId/automation-rules/:ruleId",
  authenticate,
  authorizeProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const ruleId = String(req.params.ruleId);

      await ruleRepository.delete(ruleId);

      console.log(`✅ Deleted automation rule: ${ruleId}`);

      return res.json({
        message: "Automation rule deleted",
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting automation rule", details: error });
    }
  }
);

/**
 * PATCH /api/v1/projects/:projectId/automation-rules/:ruleId/toggle
 * Toggle automation rule active status
 */
router.patch(
  "/:projectId/automation-rules/:ruleId/toggle",
  authenticate,
  authorizeProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const ruleId = String(req.params.ruleId);

      const rule = await ruleRepository.toggleActive(ruleId);

      console.log(`✅ Toggled automation rule: ${rule.name} (active: ${rule.isActive})`);

      return res.json({
        message: "Automation rule toggled",
        data: rule,
      });
    } catch (error) {
      res.status(500).json({ error: "Error toggling automation rule", details: error });
    }
  }
);

/**
 * GET /api/v1/projects/:projectId/automation-rules/stats
 * Get automation statistics
 */
router.get(
  "/:projectId/automation-rules-stats",
  authenticate,
  authorizeProjectAccess,
  async (req: Request, res: Response) => {
    try {
      const projectId = String(req.params.projectId);
      const stats = await automationEngine.getStats(projectId);

      return res.json({
        message: "Automation statistics",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ error: "Error fetching automation stats", details: error });
    }
  }
);

export default router;
