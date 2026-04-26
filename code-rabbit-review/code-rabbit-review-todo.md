# CodeRabbit Review Todo

Source: `code-rabbit-review.txt`

Status key:

- `[ ]` Pending triage or implementation
- `[-]` Implementation patched, tests pending
- `[x]` Completed
- `[n/a]` Not needed after verification

## Findings

- [x] Sign-in handles `signIn` failures and always clears loading state.
- [x] Shared `Button` defaults to `type="button"` and exposes loading state with `aria-busy`.
- [x] Signup password minimum is strengthened beyond six characters.
- [x] `Modal` has dialog ARIA attributes and Escape-key close support.
- [x] Dashboard recent activity does not format missing deadlines.
- [x] Signup API handles Prisma unique constraint races as `409`.
- [x] Date formatting helpers return `No date` for malformed date strings.
- [x] `tag.addToTask` returns `NOT_FOUND` when the tag does not exist.
- [x] `TaskForm` avoids resetting edits when `initialValue` object identity changes.
- [x] Project board displays task query errors.
- [x] Task detail update avoids separate field/status mutations that can partially save.
- [x] Prisma task creator and assignee relations have explicit `onDelete` behavior.
- [x] `task.update` validates tag IDs belong to the task project.
- [x] Project board status-change failures are surfaced to the user.
- [x] Profile form uses an inline `FormEvent` type import.
- [x] `project.delete` checks owner authorization before project existence lookup.
- [x] Project settings tag update/delete failures are surfaced to the user.
- [x] `task.create` validates tag IDs belong to the target project.
- [x] `project.getById` checks membership before project existence lookup.
- [x] `project.addMember` prevents admins from adding new admins.
- [x] `project.update` checks authorization before project existence lookup.
