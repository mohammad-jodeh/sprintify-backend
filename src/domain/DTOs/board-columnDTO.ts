import { Expose } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  IsInt,
  Min,
  IsOptional,
} from "class-validator";
import { Status } from "../entities";

export class CreateBoardColumnDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 25)
  @Expose()
  name!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Expose()
  order!: number;

  @IsNotEmpty()
  @IsUUID()
  @Expose()
  projectId!: string;
}

export class UpdateBoardColumnDto {
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  id!: string;

  @IsOptional()
  @IsString()
  @Length(1, 25)
  @Expose()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Expose()
  order?: number;
}

export class BoardColumnResponseDto {
  id: string;
  name: string;
  order: number;
  statuses?: any[];

  constructor(column: any) {
    this.id = column.id;
    this.name = column.name;
    this.order = column.order;
    this.statuses = column.statuses;
  }
}
