import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { BaseEntity, BoardColumn } from ".";
import { UUID } from "typeorm/driver/mongodb/bson.typings";

export enum StatusType {
  BACKLOG = 0,
  IN_PROGRESS = 1,
  DONE = 2,
}

@Entity("status")
export class Status extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "int", default: StatusType.IN_PROGRESS })
  type!: StatusType;

  @Column({ type: "uuid" })
  columnId!: string;

  @Column({ type: "uuid" })
  projectId!: string;

  @ManyToOne(() => BoardColumn, (column) => column.statuses, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "columnId" })
  column?: BoardColumn;
}
