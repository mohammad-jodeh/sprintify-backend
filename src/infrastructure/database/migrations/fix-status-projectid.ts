import { AppDataSource } from "../data-source";

/**
 * Migration to fix status records with null projectId values
 * This must run before schema synchronization to prevent constraint violations
 */
export async function fixStatusProjectIdMigration(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    console.warn("⚠️  Database not initialized. Skipping status projectId migration.");
    return;
  }

  const queryRunner = AppDataSource.createQueryRunner();
  
  try {
    console.info("🔧 Starting status projectId migration...");
    
    // Start a transaction for safety
    await queryRunner.startTransaction();
    
    // Check if there are any status records with null projectId
    let nullProjectIdStatuses;
    try {
      nullProjectIdStatuses = await queryRunner.query(
        `SELECT id FROM status WHERE "projectId" IS NULL`
      );
    } catch (err: any) {
      // If tables don't exist yet (first run), skip migration
      if (err.code === '42P01') { // PostgreSQL error code for undefined table
        console.info("ℹ️  Status table doesn't exist yet. Skipping migration (will run after schema sync).");
        await queryRunner.rollbackTransaction();
        return;
      }
      throw err;
    }
    
    if (nullProjectIdStatuses.length === 0) {
      console.info("✅ No status records with null projectId found. Migration skipped.");
      await queryRunner.commitTransaction();
      return;
    }
    
    console.info(`🔍 Found ${nullProjectIdStatuses.length} status records with null projectId`);
    
    // Get the first available project to assign orphaned statuses to
    const firstProject = await queryRunner.query(
      `SELECT id FROM projects LIMIT 1`
    );
    
    if (firstProject.length === 0) {
      // If no projects exist, delete orphaned statuses as they cannot be valid
      console.warn("⚠️  No projects found. Deleting orphaned status records...");
      const deleteResult = await queryRunner.query(`DELETE FROM status WHERE "projectId" IS NULL`);
      console.info(`✅ ${deleteResult.affectedRows || nullProjectIdStatuses.length} orphaned status records deleted.`);
    } else {
      // Assign orphaned statuses to the first available project
      const projectId = firstProject[0].id;
      console.info(`🔄 Assigning orphaned statuses to project: ${projectId}`);
      
      const updateResult = await queryRunner.query(
        `UPDATE status SET "projectId" = $1 WHERE "projectId" IS NULL`,
        [projectId]
      );
      
      console.info(`✅ ${updateResult.affectedRows || nullProjectIdStatuses.length} orphaned status records updated with projectId.`);
    }
    
    // Commit the transaction
    await queryRunner.commitTransaction();
    console.info("✅ Status projectId migration completed successfully.");
    
  } catch (error) {
    console.error("❌ Error during status projectId migration:", error);
    
    // Rollback transaction on error
    try {
      await queryRunner.rollbackTransaction();
      console.info("🔄 Transaction rolled back successfully.");
    } catch (rollbackError) {
      console.error("❌ Failed to rollback transaction:", rollbackError);
    }
    
    throw error;
  } finally {
    await queryRunner.release();
  }
}