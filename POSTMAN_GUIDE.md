# Sprint API - Postman Collection

This directory contains a comprehensive Postman collection for testing all endpoints of the Sprint API.

## Files

- `Sprint_API.postman_collection.json` - Complete API collection with all endpoints and tests
- `Sprint_API.postman_environment.json` - Environment variables for easy testing

## Import Instructions

1. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `Sprint_API.postman_collection.json`

2. **Import Environment:**
   - Click "Import" button again
   - Select `Sprint_API.postman_environment.json`
   - Set the environment as active (top-right dropdown)

## Usage Guide

### 1. Setup Environment
Update the environment variables in Postman:
- `base_url`: Your API base URL (default: `http://localhost:3000/api/v1`)

### 2. Authentication Flow
**Execute in this order:**

1. **Register User** → Sets `user_id` automatically
2. **Login User** → Sets `access_token` automatically

The collection uses bearer token authentication. The token is automatically set from the login response.

## Collection Variables

The collection automatically manages these variables:
- `access_token` - JWT token for authentication
- `user_id` - Current user ID 
- `project_id` - Active project ID
- `issue_id` - Current issue ID
- `epic_id` - Current epic ID
- `board_column_id` - Board column ID
- `project_member_id` - Project member ID
- `bug_issue_id`, `story_issue_id`, `task_issue_id` - Issue IDs by type

These are set automatically during test execution and used in subsequent requests.

### 3. Project Management
1. **Create Project** → Sets `project_id` automatically
2. **Get All Projects**
3. **Get Project by ID**
4. **Update Project (PATCH)** - Partial updates to projects

### 4. Issue Management
1. **Create Issue** → Sets `issue_id` automatically
2. **Get All Issues (Project)** - Supports filtering by:
   - `type` (bug, story, task)
   - `priority` (0=LOW, 1=MEDIUM, 2=HIGH)
   - `assignee` (user ID)
   - `statusId`, `sprintId`, `epicId`
3. **Get Issue by ID**
4. **Get Issue by Key** (e.g., SP-1)
5. **Update Issue (PATCH)** - Partial updates to issues
6. **Delete Issue** - Remove issues from project

### 5. Epic Management
1. **Create Epic** → Sets `epic_id` automatically
2. **Get All Epics**
3. **Get Epic by ID**
4. **Update Epic (PATCH)** - Partial updates to epics
5. **Delete Epic** - Remove epics from project

### 6. Board Column Management
1. **Create Board Column** → Sets `board_column_id` automatically
2. **Get All Board Columns**
3. **Update Board Column (PATCH)** - Change name and position
4. **Delete Board Column** - Remove columns from board

### 7. User Management
1. **Get All Users**
2. **Get User by ID**
3. **Update User Profile (PATCH)** - Update name and image
4. **Change User Password**
5. **Delete User Account**

### 8. Project Members Management
1. **Add Project Member** → Sets `project_member_id` automatically
2. **Get All Project Members**

### 9. System & Health
1. **Health Check** - Verify API service status

### 5. Epic Management
1. **Create Epic** → Sets `epic_id` automatically
2. **Get All Epics**
3. **Get Epic by ID**
4. **Get Epic by Key**
5. **Update Epic**
6. **Delete Epic**

### 6. Advanced Issue Queries
- **Get My Assigned Issues** - Issues assigned to current user
- **Get Issues by Sprint** - All issues in a specific sprint
- **Get Issues by Epic** - All issues in a specific epic

## API Features Tested

### ✅ Authentication
- User registration with email verification
- User login with JWT tokens
- Password reset flow
- Token-based authorization

### ✅ Project Management
- CRUD operations for projects
- Project member management
- Permission-based access control

### ✅ Issue Management
- Create issues with type and priority
- Filter issues by multiple criteria:
  - Issue type (bug, story, task)
  - Priority level (0-2)
  - Assignee
  - Status, Sprint, Epic
- Issue key generation (e.g., SP-1, SP-2)
- Full CRUD operations

### ✅ Epic Management
- Epic lifecycle management
- Epic-issue relationships
- Date-based epic tracking

### ✅ Board Management
- Board column creation
- Column ordering
- Project-specific boards

## Request Examples

### Create Issue with New Fields
```json
{
  "title": "Fix login bug",
  "description": "Users cannot login with their email address",
  "storyPoint": 5,
  "type": "bug",
  "issuePriority": 2,
  "assignee": "{{user_id}}",
  "statusId": "status_id_here"
}
```

### Filter Issues
```
GET /api/v1/{{project_id}}/issues?type=bug&priority=2&assignee={{user_id}}
```

### Query Parameters
- `type`: bug | story | task
- `priority`: 0 (LOW) | 1 (MEDIUM) | 2 (HIGH)
- `assignee`: User ID
- `statusId`: Status ID
- `sprintId`: Sprint ID
- `epicId`: Epic ID

## Environment Variables

The collection automatically manages these variables:
- `access_token` - JWT token for authentication
- `user_id` - Current user ID
- `project_id` - Current project ID
- `issue_id` - Current issue ID
- `epic_id` - Current epic ID

## Testing Flow

### Complete Workflow Test:
1. Register → Login
2. Create Project
3. Create Epic
4. Create Issues (different types and priorities)
5. Filter issues by various criteria
6. Update issues
7. Test issue relationships

### Issue Type Testing:
- Create issues with `type`: "bug", "story", "task"
- Create issues with `issuePriority`: 0, 1, 2
- Filter by type and priority combinations

### No Pagination:
All list endpoints return complete results without pagination limits:
- All assigned issues
- All project issues
- All sprint issues
- All epic issues

## Error Handling

The collection includes proper error handling for:
- 400 Bad Request (validation errors)
- 401 Unauthorized (missing/invalid token)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (resource not found)
- 500 Internal Server Error

## Notes

- Ensure your API server is running before testing
- Update `base_url` if using different host/port
- Some endpoints require specific user permissions
- Token automatically refreshes on login
- All timestamps use ISO 8601 format

## HTTP Methods Used

The API follows RESTful conventions:

- **POST** - Create new resources (issues, projects, users)
- **GET** - Retrieve resources and listings (with filtering support)
- **PATCH** - Partial updates to existing resources (recommended for issue updates)
- **DELETE** - Remove resources permanently

### Issue Management Methods
- `POST /projects/{id}/issues` - Create new issue
- `GET /projects/{id}/issues` - List all issues (with filters)
- `GET /projects/{id}/issues/{id}` - Get specific issue
- `PATCH /projects/{id}/issues/{id}` - Update issue (partial)
- `DELETE /projects/{id}/issues/{id}` - Delete issue

## Support

For issues with the API or collection:
1. Check server logs for errors
2. Verify environment variables are set
3. Ensure proper authentication flow
4. Check request body format matches DTOs
