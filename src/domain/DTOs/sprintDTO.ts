import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsBoolean,
  Length,
} from "class-validator";
import { Expose } from "class-transformer";
import { Sprint } from "../entities";

/**
 * DTO for creating a new sprint
 */
export class CreateSprintDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  @Length(1, 25)
  name!: string;

  @Expose()
  @IsNotEmpty()
  @IsDateString()
  startDate!: string;

  @Expose()
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;

  @Expose()
  @IsNotEmpty()
  @IsUUID()
  projectId!: string;
}

/**
 * DTO for updating an existing sprint
 */
export class UpdateSprintDto {
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  id!: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Length(1, 25)
  name?: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Expose()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Expose()
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

/**
 * DTO for sprint response
 */
export class SprintResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  startDate!: Date;

  @Expose()
  endDate!: Date;

  @Expose()
  projectId!: string;

  @Expose()
  archived!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  /**
   * Creates a SprintResponseDto from a Sprint entity
   * @param sprint - The sprint entity
   */
  constructor(sprint: Sprint) {
    this.id = sprint.id;
    this.name = sprint.name;
    this.startDate = sprint.startDate;
    this.endDate = sprint.endDate;
    this.projectId = sprint.projectId;
    this.archived = sprint.archived;
    this.createdAt = sprint.createdAt;
    this.updatedAt = sprint.updatedAt;
  }
}
