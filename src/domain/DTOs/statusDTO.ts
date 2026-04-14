import { Expose } from "class-transformer";
import { IsString, Length, IsNotEmpty, IsEnum, IsUUID } from "class-validator";
import { StatusType } from "../types";

export class CreateStatusDto {
  @IsString()
  @Length(1, 100)
  @IsNotEmpty()
  @Expose()
  name!: string;

  @IsEnum(StatusType)
  @Expose()
  type!: StatusType;

  @IsNotEmpty()
  @IsUUID()
  @Expose()
  columnId!: string;

  @IsNotEmpty()
  @IsUUID()
  @Expose()
  projectId!: string;
}

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  id!: string;

  @IsString()
  @Length(1, 100)
  @IsNotEmpty()
  @Expose()
  name!: string;

  @IsEnum(StatusType)
  @Expose()
  type!: StatusType;

  @IsNotEmpty()
  @IsUUID()
  @Expose()
  columnId!: string;

  @IsNotEmpty()
  @IsUUID()
  @Expose()
  projectId!: string;
}

export class StatusResponseDto {
  id!: string;
  name!: string;
  type!: StatusType;
  columnId!: string;
  projectId!: string;

  constructor(partial: Partial<StatusResponseDto>) {
    Object.assign(this, partial);
  }
}
