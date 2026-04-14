export enum IssueType {
  BUG = "Bug",
  STORY = "Story",
  TASK = "Task",
}

export enum StatusType {
  BACKLOG = 0,
  IN_PROGRESS = 1,
  DONE = 2,
}

export enum ProjectPermission {
  MEMBER = 0,
  MODERATOR = 1,
  ADMINISTRATOR = 2,
}

export enum NotificationType {
  PROJECT_INVITATION = 1,
  ISSUE_UPDATED = 2,
  SPRINT_UPDATED = 3,
  EPIC_UPDATED = -4,
  PROJECT_UPDATED = -5
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}
export enum issuePriority {
  LOW = "LOW",  
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

