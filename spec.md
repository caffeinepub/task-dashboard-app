# Dark Coin

## Current State
Full-stack ICP app with:
- Internet Identity auth + bank setup gate + splash screen
- 6-task grid with glassmorphic cards, external link support, proof upload
- Admin panel at /admin protected by PIN (09186114) + face scan gate
- Backend: updateTask, reviewPayment, updatePaymentStatus, clearAllData, deleteUser, saveBankDetails, getAllUsersAnalytics, etc.
- ProfilePage with withdrawal history, bank details, task stats
- Task URL stored only in frontend TASK_CONFIG (not backend), so URL edits in admin panel have no backend counterpart

## Requested Changes (Diff)

### Add
- AI Chat bot ("Chat with Us") button visible on home and profile pages
  - Floating action button (bottom right, above bottom nav)
  - Opens a chat sheet/modal
  - Bot flow: 1) Ask for principal ID, 2) Ask what the problem is, 3) Look up that user's data (profile, submissions, payments, balance, bank details) using backend queries, 4) Answer queries using only that user's data
  - Bot must never reveal other users' data
  - Bot answers queries: balance, task status, withdrawal status, bank details confirmation, general support
  - Secure: bot only uses principalId provided by user, validates it, won't accept random text
- Winning history section on Profile page (task submissions with approved status shown as "earnings")
- Task link (URL) saving: add `taskLink` field to backend Task type and updateTask so URLs persist in backend (not just frontend TASK_CONFIG)

### Modify
- Fix "Failed to update task" error: The root cause is the `updateTask` Motoko function is called with image as `undefined` (None) which the SDK encodes correctly, BUT the real issue is that the backend `updateTask` needs the `taskLink` field too. Currently URL is only stored in frontend. Extend backend Task to include `taskLink: Text` and update `updateTask` to accept it.
- Fix task URL field in admin: currently the URL field in AdminTaskRow only updates local state but doesn't pass startLink to `updateTask`. Wire startLink into the save call.
- Admin panel task save: pass `startLink` as the task link to backend updateTask
- TaskCard: read task link from backend `task.taskLink` field (falling back to TASK_CONFIG for backward compat)
- HomePage: use backend task link when starting a task
- ProfilePage: add "Winning History" section showing approved submissions with task name, date, reward amount earned
- User app UI redesign: more premium fintech feel — better spacing, typography, cards with gradient borders, section headers with icons
- Withdrawal history UI: redesign with clearer status indicators, timeline-style layout

### Remove
- Nothing removed

## Implementation Plan
1. Update Motoko backend: add `taskLink: Text` to Task type, update `updateTask` to accept taskLink param, update `initTasks` to set empty taskLink
2. Regenerate backend bindings (backend.d.ts will be updated via generate_motoko_code)
3. Update useUpdateTask hook: add taskLink param to mutationFn
4. Update AdminTaskRow: pass startLink to updateTask.mutateAsync call
5. Update TaskCard: read task.taskLink from backend, fall back to TASK_CONFIG[index].link
6. Update HomePage handleStartTask: use task.taskLink for external link detection
7. Add AIChatBot component: floating button + sheet with conversation flow
8. Update ProfilePage: add WinningHistory section (approved submissions), redesign withdrawal history with timeline style
9. Full UI polish pass on home page, profile page layout
