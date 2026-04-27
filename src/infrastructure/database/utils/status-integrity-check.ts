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
  issuesWithoutStatusCount: number;
  issuesWithStatusCount: number;
  statusesCount: number;
  brokenIssueStatusLinksCount: number;
  invalidStatusIdFormatCount: number;
  missingStatusRecordCount: number;
  statusProjectMismatchCount: number;
  statusColumnProjectMismatchCount: number;
  sampleProblems: IntegrityProblem[];
}

export const getStatusIntegrityReport = async (
  sampleLimit = 20
): Promise<IntegrityReport> => {
  const issueRepo = AppDataSource.getRepository(Issue);
  const statusRepo = AppDataSource.getRepository(Status);

  const validStatusIdExpr =
    '"issue"."statusId" IS NOT NULL AND BTRIM("issue"."statusId"::text) <> \'\' AND LOWER("issue"."statusId"::text) <> \'null\'';

  const invalidStatusIdFormatQuery = issueRepo
    .createQueryBuilder("issue")
    .where(validStatusIdExpr)
    .andWhere(
      '"issue"."statusId"::text !~* \'[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$\''
    );

  const baseQuery = issueRepo
    .createQueryBuilder("issue")
    .leftJoin(Status, "status", '"status"."id"::text = "issue"."statusId"::text')
    .leftJoin(BoardColumn, "column", '"column"."id" = "status"."columnId"')
    .where(validStatusIdExpr)
    .andWhere(
      '"status"."id" IS NULL OR "status"."projectId" <> "issue"."projectId" OR "column"."id" IS NULL OR "column"."projectId" <> "issue"."projectId"'
    );

  const [
    issuesWithoutStatusCount,
    issuesWithStatusCount,
    statusesCount,
    brokenIssueStatusLinksCount,
    invalidStatusIdFormatCount,
    missingStatusRecordCount,
    statusProjectMismatchCount,
    statusColumnProjectMismatchCount,
  ] =
    await Promise.all([
      issueRepo
        .createQueryBuilder("issue")
        .where('"issue"."statusId" IS NULL OR BTRIM("issue"."statusId"::text) = \'\' OR LOWER("issue"."statusId"::text) = \'null\'')
        .getCount(),
      issueRepo
        .createQueryBuilder("issue")
        .where(validStatusIdExpr)
        .getCount(),
      statusRepo.count(),
      baseQuery.clone().getCount(),
      invalidStatusIdFormatQuery.clone().getCount(),
      issueRepo
        .createQueryBuilder("issue")
        .leftJoin(Status, "status", '"status"."id"::text = "issue"."statusId"::text')
        .where(validStatusIdExpr)
        .andWhere('"status"."id" IS NULL')
        .getCount(),
      issueRepo
        .createQueryBuilder("issue")
        .leftJoin(Status, "status", '"status"."id"::text = "issue"."statusId"::text')
        .where(validStatusIdExpr)
        .andWhere('"status"."id" IS NOT NULL')
        .andWhere('"status"."projectId" <> "issue"."projectId"')
        .getCount(),
      issueRepo
        .createQueryBuilder("issue")
        .leftJoin(Status, "status", '"status"."id"::text = "issue"."statusId"::text')
        .leftJoin(BoardColumn, "column", '"column"."id" = "status"."columnId"')
        .where(validStatusIdExpr)
        .andWhere('"status"."id" IS NOT NULL')
        .andWhere('("column"."id" IS NULL OR "column"."projectId" <> "issue"."projectId")')
        .getCount(),
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
    issuesWithoutStatusCount,
    issuesWithStatusCount,
    statusesCount,
    brokenIssueStatusLinksCount,
    invalidStatusIdFormatCount,
    missingStatusRecordCount,
    statusProjectMismatchCount,
    statusColumnProjectMismatchCount,
    sampleProblems: sampleRows,
  };
};

export const logStatusIntegrityReport = async (): Promise<void> => {
  try {
    const report = await getStatusIntegrityReport();

    if (
      report.brokenIssueStatusLinksCount === 0 &&
      report.issuesWithoutStatusCount === 0
    ) {
      console.log(
        `✅ [STATUS-INTEGRITY] OK | issuesWithStatus=${report.issuesWithStatusCount} statuses=${report.statusesCount}`
      );
      return;
    }

    console.warn(
      `⚠️ [STATUS-INTEGRITY] Summary | issuesWithoutStatus=${report.issuesWithoutStatusCount} issuesWithStatus=${report.issuesWithStatusCount} statuses=${report.statusesCount} brokenLinks=${report.brokenIssueStatusLinksCount} invalidStatusIdFormat=${report.invalidStatusIdFormatCount} missingStatusRecord=${report.missingStatusRecordCount} statusProjectMismatch=${report.statusProjectMismatchCount} statusColumnProjectMismatch=${report.statusColumnProjectMismatchCount}`
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
