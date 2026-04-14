import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from "class-validator";
import { Transform, Expose } from "class-transformer";
import { Project, Sprint } from "../entities";
import { UserResponseDto } from "./userDTO";
import { ProjectPermission } from "../types";

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-zA-Z0-9_ ]+$/)
  @Length(3, 50)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  @Matches(/^[A-Za-z]{1,5}$/, {
    message: "Project key must be 1-5 letters, not case sensitive",
  })
  keyPrefix!: string;

  @IsNotEmpty()
  @IsUUID()
  createdBy!: string;
}

export class UpdateProjectDTO {
  @Expose()
  @IsUUID()
  id!: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_ ]+$/)
  @Length(3, 50)
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toLowerCase())
  @Matches(/^[A-Za-z]{1,5}$/, {
    message: "Project key must be 1-5 letters, not case sensitive",
  })
  keyPrefix?: string;
}

export class ProjectResponseDto {
  id: string;
  name: string;
  keyPrefix: string;
  createdBy: string;
  members: {
    id: string;
    permission: ProjectPermission;
    user: UserResponseDto | null;
    userId?: string;
  }[];
  constructor(project: Project) {
    this.id = project.id;
    this.name = project.name;
    this.keyPrefix = project.keyPrefix;
    this.createdBy = project.createdBy;
    this.members =
      project.members?.map((member) => {
        if (member.user) {
          return {
            id: member.id,
            permission: member.permission,
            user: new UserResponseDto(member.user),
            userId: member.user.id,
          };
        } else {
          return {
            id: member.id,
            permission: member.permission,
            user: null,
            userId: member.userId,
          };
        }
      }) ?? [];
  }
}
