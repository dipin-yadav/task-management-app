# API Reference — tRPC Routers

This document details all tRPC procedures (API endpoints) for the task management application.

---

## Auth Router (`auth`)

| Procedure | Type | Auth | Input | Output | Description |
|---|---|---|---|---|---|
| `auth.getProfile` | `query` | Protected | — | `User` | Get the current user's profile |
| `auth.updateProfile` | `mutation` | Protected | `{ name?, image? }` | `User` | Update profile fields |

> **Note:** Signup is handled via a custom REST API route (`POST /api/auth/signup`), not tRPC, because it happens before authentication.

### Signup API Route (`POST /api/auth/signup`)

```typescript
// Input
{
  name: string;
  email: string;      // Must be valid email format
  password: string;   // Min 8 chars, must contain uppercase, lowercase, number
}

// Response (201)
{ message: "User created successfully" }

// Response (400)
{ message: "Email already in use" }
// or
{ message: "Password does not meet requirements" }
```

---

## Project Router (`project`)

| Procedure | Type | Auth | Input | Output | Description |
|---|---|---|---|---|---|
| `project.create` | `mutation` | Protected | `{ name, description? }` | `Project` | Create a new project; caller is auto-added as OWNER |
| `project.list` | `query` | Protected | — | `Project[]` | List all projects the user is a member of |
| `project.getById` | `query` | Protected | `{ id }` | `Project + members + taskCounts` | Get project details (must be member) |
| `project.update` | `mutation` | Protected | `{ id, name?, description? }` | `Project` | Update project (OWNER/ADMIN) |
| `project.delete` | `mutation` | Protected | `{ id }` | `void` | Delete project and all data (OWNER only) |
| `project.addMember` | `mutation` | Protected | `{ projectId, email, role? }` | `ProjectMember` | Add user to project by email (OWNER/ADMIN) |
| `project.removeMember` | `mutation` | Protected | `{ projectId, userId }` | `void` | Remove member (OWNER/ADMIN, cannot remove OWNER) |
| `project.updateMemberRole` | `mutation` | Protected | `{ projectId, userId, role }` | `ProjectMember` | Change member role (OWNER only) |

### Authorization Rules

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| View project | ✅ | ✅ | ✅ |
| Update project info | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Add member | ✅ | ✅ | ❌ |
| Remove member | ✅ | ✅ | ❌ |
| Change member role | ✅ | ❌ | ❌ |

---

## Task Router (`task`)

| Procedure | Type | Auth | Input | Output | Description |
|---|---|---|---|---|---|
| `task.create` | `mutation` | Protected | `{ projectId, title, description?, priority?, deadline?, assigneeId?, tagIds? }` | `Task` | Create a task (must be project member) |
| `task.list` | `query` | Protected | `{ projectId, status?, priority?, assigneeId?, tagIds?, search? }` | `Task[]` | List tasks with filters |
| `task.getById` | `query` | Protected | `{ id }` | `Task + tags + assignee + creator` | Get full task details |
| `task.update` | `mutation` | Protected | `{ id, title?, description?, priority?, deadline?, assigneeId?, tagIds? }` | `Task` | Update task fields |
| `task.delete` | `mutation` | Protected | `{ id }` | `void` | Delete a task |
| `task.assign` | `mutation` | Protected | `{ id, assigneeId }` | `Task` | Assign/reassign task to project member |
| `task.updateStatus` | `mutation` | Protected | `{ id, status }` | `Task` | Quick status change (drag & drop) |

### Input Validation (Zod Schemas)

```typescript
// Task creation input
const createTaskInput = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  deadline: z.date().optional(),
  assigneeId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

// Task filter input
const listTasksInput = z.object({
  projectId: z.string().cuid(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  search: z.string().optional(),
});
```

---

## Tag Router (`tag`)

| Procedure | Type | Auth | Input | Output | Description |
|---|---|---|---|---|---|
| `tag.create` | `mutation` | Protected | `{ projectId, name, color? }` | `Tag` | Create a tag in a project |
| `tag.list` | `query` | Protected | `{ projectId }` | `Tag[]` | List all tags for a project |
| `tag.update` | `mutation` | Protected | `{ id, name?, color? }` | `Tag` | Update tag name/color |
| `tag.delete` | `mutation` | Protected | `{ id }` | `void` | Delete a tag |
| `tag.addToTask` | `mutation` | Protected | `{ taskId, tagId }` | `TaskTag` | Associate tag with task |
| `tag.removeFromTask` | `mutation` | Protected | `{ taskId, tagId }` | `void` | Remove tag from task |

---

## Dashboard Router (`dashboard`) — Optional

| Procedure | Type | Auth | Input | Output | Description |
|---|---|---|---|---|---|
| `dashboard.getStats` | `query` | Protected | — | `{ todo, inProgress, inReview, done, total }` | Task counts by status across all user's projects |
| `dashboard.getUpcomingDeadlines` | `query` | Protected | `{ days? }` | `Task[]` | Tasks due within N days (default 7) |
| `dashboard.getRecentActivity` | `query` | Protected | `{ limit? }` | `Task[]` | Recently created/updated tasks (default 10) |
| `dashboard.getMyTasks` | `query` | Protected | — | `Task[]` | All tasks assigned to current user |

---

## Error Handling

All procedures use consistent error handling via tRPC's `TRPCError`:

| Error Code | When Used |
|---|---|
| `UNAUTHORIZED` | No valid session |
| `FORBIDDEN` | Insufficient permissions (e.g., MEMBER trying to delete project) |
| `NOT_FOUND` | Project/Task/Tag not found |
| `BAD_REQUEST` | Invalid input (caught by Zod validation) |
| `CONFLICT` | Duplicate entry (e.g., tag name already exists in project) |
| `INTERNAL_SERVER_ERROR` | Unexpected errors |
