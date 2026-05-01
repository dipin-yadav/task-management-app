# Security Hardening Report

This document outlines the security vulnerabilities identified and remediated during the security hardening phase of the Task Management App.

## 1. Account Enumeration (REST API)

**Vulnerability**: The `/api/auth/signup` endpoint returned different status codes for existing vs. new users (`409 Conflict` vs. `201 Created`), allowing attackers to discover registered emails.

**Mitigation**:

- Unified error responses to a generic `400 Bad Request` with the message `"Invalid registration details"`.
- Attackers can no longer distinguish between a formatting error and an existing user.

**Files**: `src/pages/api/auth/signup.ts`, `src/pages/api/auth/signup.test.ts`

## 2. Account Enumeration (tRPC)

**Vulnerability**: The `project.addMember` procedure returned distinct errors for "User not found" and "Member already in project".

**Mitigation**:

- Unified error responses to a generic `"Member could not be added to the project"` message.
- This prevents attackers from probing user existence by attempting to add them to a project.

**Files**: `src/server/api/routers/project.ts`, `src/server/api/routers/project.test.ts`

## 3. Login Timing Attacks

**Vulnerability**: The login flow was faster for non-existent users because it skipped the expensive `bcrypt.compare()` step.

**Mitigation**:

- Implemented a "dummy hash" verification step.
- When a user is not found, the system still performs a `bcrypt` verification against a fixed hash, ensuring consistent response times regardless of account existence.

**Files**: `src/server/auth.ts`

## 4. Horizontal Privilege Escalation

**Vulnerability**: Project `ADMIN`s were able to remove other `ADMIN`s from a project.

**Mitigation**:

- Implemented role-based hierarchy checks in `removeMember`.
- `ADMIN`s can now only remove regular `MEMBER`s or themselves.
- Only the `OWNER` can remove an `ADMIN`.

**Files**: `src/server/api/routers/project.ts`, `src/test/security_privilege.test.ts`

## 5. Insecure Task Deletion

**Vulnerability**: Any project `MEMBER` could delete any task in the project, regardless of who created it.

**Mitigation**:

- Restricted task deletion to the project `OWNER`, project `ADMIN`s, or the task's original `creator`.
- Regular members can no longer delete tasks they didn't create.

**Files**: `src/server/api/routers/task.ts`, `src/test/security_task.test.ts`

## 6. Information Disclosure (Email Leaks)

**Vulnerability**: Project members could see the email addresses of all other members, even if they had no administrative need.

**Mitigation**:

- Implemented email masking in `project.getById`. Emails are now only visible to `OWNER`, `ADMIN`, or the user themselves.
- Removed `email` fields from `project.list` and all `task` router responses (`assignee` and `creator` objects).
- UI now falls back to displaying names or initials.

**Files**: `src/server/api/routers/project.ts`, `src/server/api/routers/task.ts`, `src/test/security_disclosure.test.ts`, and various frontend components.

## Security Verification

All security mitigations are covered by a dedicated test suite in `src/test/`:

- `security_enumeration.test.ts`
- `security_privilege.test.ts`
- `security_task.test.ts`
- `security_disclosure.test.ts`

To run the security tests:

```bash
npm run test
```
