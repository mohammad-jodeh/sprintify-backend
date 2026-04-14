# Status ProjectId Migration Fix

## Problem

When starting the application, TypeORM fails to synchronize the database schema with the following error:

```
ALTER TABLE "status" ALTER COLUMN "projectId" SET NOT NULL
[ERROR] column "projectId" of relation "status" contains null values
```

This occurs because:
1. The `Status` entity defines `projectId` as a required field (`@Column({ type: "uuid" }) projectId!: string`)
2. The database contains existing status records with NULL `projectId` values
3. TypeORM cannot set the NOT NULL constraint while null data exists

## Root Cause

Existing status records in the database were created without proper `projectId` values, likely due to:
- Previous versions of the code that didn't enforce the constraint
- Manual database operations
- Development/testing data that wasn't properly cleaned up

## Solution

### 1. Migration Script

Created `fix-status-projectid.ts` migration that:
- Identifies status records with NULL `projectId` values
- Assigns orphaned statuses to the first available project
- Deletes orphaned statuses if no projects exist
- Provides comprehensive logging and error handling

### 2. Updated Initialization Process

Modified the application startup process to:
1. Initialize database connection
2. Run data migrations **before** schema synchronization
3. Manually trigger schema synchronization after data cleanup

### 3. Database Configuration

- Disabled automatic synchronization (`synchronize: false`)
- Added manual synchronization control after migrations

## Files Modified

1. **`src/infrastructure/database/migrations/fix-status-projectid.ts`** - New migration script
2. **`src/index.ts`** - Updated startup process to run migrations
3. **`src/infrastructure/database/data-source.ts`** - Disabled auto-sync

## How It Works

### Migration Logic
```typescript
// 1. Check for NULL projectId records
SELECT id FROM status WHERE "projectId" IS NULL

// 2a. If projects exist, assign to first project
UPDATE status SET "projectId" = $1 WHERE "projectId" IS NULL

// 2b. If no projects exist, delete orphaned records
DELETE FROM status WHERE "projectId" IS NULL
```

### Startup Sequence
```typescript
1. ensureDatabaseExists()     // Create database if needed
2. AppDataSource.initialize() // Connect to database
3. fixStatusProjectIdMigration() // Clean up data
4. AppDataSource.synchronize()   // Apply schema changes
```

## Safety Features

- **Idempotent**: Can be run multiple times safely
- **Conditional**: Only processes records that actually need fixing
- **Logged**: Comprehensive logging for troubleshooting
- **Error Handling**: Graceful failure with proper cleanup
- **Transaction Safe**: Uses query runner for database operations

## Testing

The migration includes checks for:
- Database initialization state
- Existence of null projectId records
- Availability of projects for assignment
- Error scenarios and edge cases

## Usage

The migration runs automatically on application startup. No manual intervention required.

For manual verification, the migration can be tested using the verification script in `/tmp/verify-migration-fix.ts`.

## Future Prevention

This fix ensures that:
1. All existing status records have valid `projectId` values
2. The NOT NULL constraint can be applied successfully
3. Future status creation will enforce the required `projectId` field through:
   - DTO validation (`@IsNotEmpty() @IsUUID()`)
   - Controller logic that sets `projectId` from request parameters
   - Entity definition that requires the field