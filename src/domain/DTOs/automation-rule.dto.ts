import { IsString, IsOptional, IsJSON, IsBoolean } from "class-validator";

export class CreateAutomationRuleDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  triggerType!: "status_changed" | "issue_created" | "issue_commented" | "priority_changed" | "assignee_changed" | "due_date_approaching";

  @IsJSON()
  triggerCondition!: Record<string, any>;

  @IsString()
  actionType!:
    | "notify_user"
    | "auto_transition"
    | "assign_user"
    | "add_comment"
    | "create_subtask"
    | "send_webhook";

  @IsJSON()
  actionPayload!: Record<string, any>;
}

export class UpdateAutomationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  triggerType?: string;

  @IsOptional()
  @IsJSON()
  triggerCondition?: Record<string, any>;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsJSON()
  actionPayload?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AutomationRuleResponseDto {
  id!: string;
  name!: string;
  description?: string;
  triggerType!: string;
  triggerCondition!: Record<string, any>;
  actionType!: string;
  actionPayload!: Record<string, any>;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  createdBy!: {
    id: string;
    fullName: string;
    email: string;
  };
}
