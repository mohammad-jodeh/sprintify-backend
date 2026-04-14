import {
  CreateProjectMemberDto,
  UpdateProjectMemberDto,
} from "../DTOs/projectMemberDTO";
import { ProjectMember } from "../entities";
import { FindProjectMemberOptions } from "../types";

export interface IProjectMemberRepo {
  add(dto: CreateProjectMemberDto): Promise<ProjectMember>;
  update(dto: UpdateProjectMemberDto): Promise<ProjectMember>;
  remove(membershipId: string): Promise<void>;
  find(options: FindProjectMemberOptions): Promise<ProjectMember[]>;
}
