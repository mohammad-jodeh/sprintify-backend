import { Issue } from "../entities";
import { FindIssueQueryOptions } from "../option/issueQueryOptions"; // Only import FindIssueQueryOptions

export interface IIssueRepo {
  // Create new issue
  create(issueData: Partial<Issue>): Promise<Issue>;

  // Find issues with various filters (lightweight)
  find(
    options?: FindIssueQueryOptions // Use the imported interface
  ): Promise<{ issues: Issue[]; total: number }>;

  // Get full issue by ID
  getById(id: string): Promise<Issue | null>;

  // Get full issue by key
  getByKey(key: string): Promise<Issue | null>;

  // Update issue
  update(id: string, updateData: Partial<Issue>): Promise<Issue | null>;

  // Delete issue
  delete(id: string): Promise<boolean>;

  // Generate next issue key for project
  generateIssueKey(projectId: string): Promise<string>;
}
