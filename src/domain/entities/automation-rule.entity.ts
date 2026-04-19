import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project, User } from "./index";

/**
 * Automation Rule Entity
 * Defines workflow automation triggers and actions
 */
@Entity("automation_rules")
export class AutomationRule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @ManyToOne(() => Project, (project) => project.automationRules, {
    onDelete: "CASCADE",
  })
  project!: Project;

  @Column()
  projectId!: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @Column()
  createdById!: string;

  /**
   * TRIGGER TYPES:
   * - status_changed: When issue status changes
   * - issue_created: When issue is created
   * - issue_commented: When issue gets a comment
   * - priority_changed: When priority changes
   * - assignee_changed: When assignee changes
   * - due_date_approaching: When due date is near
   */
  @Column()
  triggerType!: "status_changed" | "issue_created" | "issue_commented" | "priority_changed" | "assignee_changed" | "due_date_approaching";

  /**
   * Trigger condition (JSON)
   * Examples:
   * { "statusId": "uuid" } - specific status
   * { "fromStatus": "In Progress", "toStatus": "Done" } - status transition
   * { "priority": "HIGH" } - priority filter
   */
  @Column({ type: "jsonb" })
  triggerCondition!: Record<string, any>;

  /**
   * ACTION TYPES:
   * - notify_user: Send notification
   * - auto_transition: Auto-move issue to another status
   * - assign_user: Auto-assign issue
   * - add_comment: Auto-add comment
   * - create_subtask: Auto-create subtask
   * - send_webhook: Send to external service
   */
  @Column()
  actionType!:
    | "notify_user"
    | "auto_transition"
    | "assign_user"
    | "add_comment"
    | "create_subtask"
    | "send_webhook";

  /**
   * Action payload (JSON)
   * Examples:
   * { "targetStatusId": "uuid" } - for auto_transition
   * { "userId": "uuid" } - for assign_user
   * { "message": "text", "recipients": ["user1", "user2"] } - for notify_user
   */
  @Column({ type: "jsonb" })
  actionPayload!: Record<string, any>;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
