import { IssueType, issuePriority } from "../types";

export interface IssueQueryOptions {
  sprintId?: string;
  assignee?: string;
  statusId?: string;
  epicId?: string;
  type?: IssueType;
  priority?: issuePriority;
}

export interface FindIssueQueryOptions extends IssueQueryOptions {
  projectId?: string; // projectId is optional in the find method
}
