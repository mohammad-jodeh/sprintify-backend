import { AppDataSource } from "../data-source";
import { BoardColumn, Issue, Status } from "../../../domain/entities";

interface IntegrityProblem {
  issueId: string;
  issueKey: string;
  issueProjectId: string;
  statusId: string;
  statusProjectId: string | null;
  statusColumnId: string | null;
  columnProjectId: string | null;
}

interface IntegrityReport {
  checkedAt: string;
  issuesWithStatusCount: number;
  statusesCount: number;
  brokenIssueStatusLinks: number;
  sampleProblems: IntegrityProblem[];
}

export const getStatusIntegrityReport = async (
  sampleLimit = 20
): Promise<IntegrityReport> => {
  const issueRepo = AppDataSource.getRepository(Issue);
  const statusRepo = AppDataSource.getRepository(Status);

  const baseQuery = issueRepo
    .createQueryBuilder("issue")
    .leftJoin(Status, "status", "status.id = issue.statusId")
    .leftJoin(BoardColumn, "column", "column.id = status.columnId")
    .where("issue.statusId IS NOT NULL")
    .andWhere(
      "status.id IS NULL OR status.projectId <> issue.projectId OR column.id IS NULL OR column.projectId <> issue.projectId"
    );

  const [issuesWithStatusCount, statusesCount, brokenIssueStatusLinks] =
    await Promise.all([
      issueRepo
        .createQueryBuilder("issue")
        .where("issue.statusId IS NOT NULL")
        .getCount(),
      statusRepo.count(),
      baseQuery.clone().getCount(),
    ]);

  const sampleRows = await baseQuery
    .clone()
    .select([
      'issue.id AS "issueId"',
      'issue.key AS "issueKey"',
      'issue.projectId AS "issueProjectId"',
      'issue.statusId AS "statusId"',
      'status.projectId AS "statusProjectId"',
      'status.columnId AS "statusColumnId"',
      'column.projectId AS "columnProjectId"',
    ])
    .orderBy("issue.createdAt", "DESC")
    .limit(sampleLimit)
    .getRawMany<IntegrityProblem>();

  return {
    checkedAt: new Date().toISOString(),
    issuesWithStatusCount,
    statusesCount,
    brokenIssueStatusLinks,
    sampleProblems: sampleRows,
  };
};

export const logStatusIntegrityReport = async (): Promise<void> => {
  try {
    const report = await getStatusIntegrityReport();

    if (report.brokenIssueStatusLinks === 0) {
      console.log(
        `✅ [STATUS-INTEGRITY] OK | issuesWithStatus=${report.issuesWithStatusCount} statuses=${report.statusesCount}`
      );
      return;
    }

    console.warn(
      `⚠️ [STATUS-INTEGRITY] Found ${report.brokenIssueStatusLinks} broken issue-status links | issuesWithStatus=${report.issuesWithStatusCount} statuses=${report.statusesCount}`
    );

    report.sampleProblems.forEach((item, index) => {
      console.warn(
        `⚠️ [STATUS-INTEGRITY] #${index + 1} issueId=${item.issueId} key=${item.issueKey} issueProject=${item.issueProjectId} statusId=${item.statusId} statusProject=${item.statusProjectId} statusColumnId=${item.statusColumnId} columnProject=${item.columnProjectId}`
      );
    });
  } catch (error) {
    console.error("❌ [STATUS-INTEGRITY] Failed to run integrity check:", error);
  }
};
