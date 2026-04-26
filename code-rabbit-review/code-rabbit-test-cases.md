# CodeRabbit Review Test Cases

Source: `code-rabbit-review.txt`

These cases supplement the automated Vitest coverage added in `src/**/*.test.ts` and `src/**/*.test.tsx`.
The existing `docs/test_cases.md` file is intentionally unchanged.

## Automated Coverage Added

- Signup password policy: `src/server/auth/signup.test.ts`
  - Rejects passwords shorter than 12 characters.
  - Accepts valid signup input with a 12+ character password.
- Signup API race handling: `src/pages/api/auth/signup.test.ts`
  - Returns `409` for a Prisma `P2002` unique-email conflict after the initial lookup.
- Date formatting: `src/utils/format.test.ts`
  - Formats valid dates.
  - Returns `No date` for null, undefined, and malformed date values.
- Button accessibility: `src/components/ui/Button.test.tsx`
  - Defaults to `type="button"`.
  - Allows submit override and renders `aria-busy` while loading.
- Modal accessibility: `src/components/ui/Modal.test.tsx`
  - Renders nothing when closed.
  - Renders dialog role, modal state, and title labelling when open.
- Prisma relation policy: `src/server/prisma-schema.test.ts`
  - Verifies explicit `onDelete: Restrict` for task creators.
  - Verifies explicit `onDelete: SetNull` for task assignees.
- Project router authorization: `src/server/api/routers/project.test.ts`
  - Checks membership before project detail lookup.
  - Checks edit authorization before project lookup.
  - Checks owner authorization before delete lookup.
  - Prevents admins from adding new admins.
  - Allows owners to add new admins.
- Task router integrity: `src/server/api/routers/task.test.ts`
  - Rejects task creation with tags from another project.
  - Updates task fields and status through one update mutation.
  - Rejects task tag updates with foreign-project tags before changing tag links.
- Tag router missing-tag handling: `src/server/api/routers/tag.test.ts`
  - Returns `NOT_FOUND` when adding a missing tag to a task.

## Manual/UI Cases

- Sign in network failure:
  - Make `signIn("credentials")` reject.
  - Submit the form.
  - Expected: the button is re-enabled and a user-facing connection error appears.
- Modal Escape behavior:
  - Open any app modal.
  - Press Escape.
  - Expected: the modal closes.
- Dashboard recent activity without deadline:
  - Show a recently updated task with `deadline: null`.
  - Expected: no `Due No date` or invalid date text is rendered for that task.
- Task form edit stability:
  - Start editing a task and change a field locally.
  - Trigger a parent re-render without changing the task id.
  - Expected: the draft field value is not reset.
- Project board task query error:
  - Force `task.list` to fail.
  - Expected: the board shows a visible failed-to-load state, not an empty or blank board.
- Project board status-change failure:
  - Force `task.updateStatus` to fail from drag/drop or the status select.
  - Expected: the board shows a visible failure message.
- Task detail status update:
  - Edit fields and status in one save.
  - Expected: one `task.update` mutation saves fields and status together, and edit mode closes only on success.
- Project settings tag mutation errors:
  - Force tag save/delete to fail.
  - Expected: the settings page shows the mutation error to the user.
- Profile form type coverage:
  - Run TypeScript/lint.
  - Expected: the submit handler uses the imported `FormEvent` type without relying on a React namespace import.
