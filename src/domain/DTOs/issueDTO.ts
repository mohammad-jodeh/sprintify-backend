import { IsString, IsNumber, IsOptional, Length, IsUUID, IsEnum } from "class-validator";
import { Expose, Type } from 'class-transformer'; // Added Expose, Type
import { IssueType, issuePriority } from "../types";

export class CreateIssueDto {
  @IsString()
  @Length(1, 250)
  title!: string;

  @IsString()
  description!: string;

  @IsNumber()
  storyPoint!: number;

  @IsUUID()
  projectId!: string;

  @IsOptional()
  @IsUUID()
  assignee?: string;

  @IsOptional()
  @IsUUID()
  epicId?: string;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;
  @IsOptional()
  @IsEnum(IssueType)
  type: IssueType = IssueType.TASK;

  @IsOptional()
  @IsEnum(issuePriority)
  issuePriority: issuePriority = issuePriority.MEDIUM;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  @Length(1, 250)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  storyPoint?: number;

  @IsOptional()
  @IsUUID()
  assignee?: string;

  @IsOptional()
  @IsUUID()
  epicId?: string;

  @IsOptional()
  @IsUUID()
  sprintId?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @IsOptional()
  @IsEnum(issuePriority)
  issuePriority?: issuePriority;
}

class BasicUserDto {
  @Expose() id!: string;
  @Expose() fullName!: string;
  @Expose() email!: string;
  @Expose() image?: string; 
}

class BasicProjectDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() keyPrefix!: string;
}

class BasicEpicDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() description?: string;
}

class BasicSprintDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() startDate?: Date;
  @Expose() endDate?: Date;
}

class BasicStatusDto {
  @Expose() id!: string;
  @Expose() name!: string;
  @Expose() type!: number; // Add the type field for status categorization
  @Expose() order?: number; // order is optional in Partial, required in Full
}

// Partial issue response for listing (lightweight)
export class IssuePartialResponseDto {
  @Expose() id!: string;
  @Expose() key!: string;
  @Expose() title!: string;
  @Expose() description!: string;
  @Expose() storyPoint!: number;
  @Expose() statusId?: string;
  @Expose() assignee?: string;
  @Expose() epicId?: string;
  @Expose() sprintId?: string;
  @Expose() projectId!: string;
  @Expose() issuePriority!: issuePriority;
  
  @Expose()
  @Type(() => BasicUserDto)
  assigneeUser?: BasicUserDto;

  @Expose()
  @Type(() => BasicEpicDto)
  epic?: BasicEpicDto;

  @Expose()
  @Type(() => BasicSprintDto)
  sprint?: BasicSprintDto;

  @Expose()
  @Type(() => BasicStatusDto)
  status?: BasicStatusDto;

  @Expose()
  type!: IssueType; // Added type field
}

// Full issue response for detailed view
export class IssueFullResponseDto {
  @Expose() id!: string;
  @Expose() key!: string;
  @Expose() title!: string;
  @Expose() description!: string;
  @Expose() storyPoint!: number;
  @Expose() statusId?: string;
  @Expose() assignee?: string;  @Expose() epicId?: string;
  @Expose() sprintId?: string;
  @Expose() projectId!: string;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
  @Expose() issuePriority!: issuePriority;
  
  @Expose()
  @Type(() => BasicUserDto)
  assigneeUser?: BasicUserDto;

  @Expose()
  @Type(() => BasicProjectDto)
  project!: BasicProjectDto;

  @Expose()
  @Type(() => BasicEpicDto)
  epic?: BasicEpicDto;

  @Expose()
  @Type(() => BasicSprintDto)
  sprint?: BasicSprintDto;

  @Expose()
  @Type(() => BasicStatusDto)
  status?: BasicStatusDto;

  @Expose()
  type!: IssueType; // Added type field
}
