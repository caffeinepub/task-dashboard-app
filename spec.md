# Dark Coin

## Current State
Full-stack task-earn app with ICP auth, 6-task grid, proof uploads, admin panel at /admin (PIN + face auth gate). Backend uses Motoko with AccessControl component for admin role checks. All admin backend functions (getAllUsersAnalytics, getAllPayments, clearAllData, reviewPayment, updatePaymentStatus, deleteUser, blockUser, unblockUser, updateTask) are gated by `AccessControl.isAdmin()` which always returns false because no principal has ever been assigned the admin role via `assignCallerUserRole`. The PIN+face auth gate is frontend-only. Currency shown as "DC" throughout. Task reward hardcoded to +10 DC. Withdrawal allows any amount up to balance. All 6 tasks always accessible even if empty. Tasks lack a reward field.

## Requested Changes (Diff)

### Add
- Task reward field (INR amount, set by admin per task, e.g. "₹50" or "₹1,200")
- Fixed withdrawal amount tiers: 10, 30, 50, 100, 150, 500, 750, 1200, 3000, 5000, 10000 INR only (dropdown/buttons, no free text)
- Block user from opening tasks with no title/image uploaded (tasks with default "Task N" title AND no image are considered empty)

### Modify
- Backend admin auth: replace `AccessControl.isAdmin()` checks in all admin functions with a simple `not caller.isAnonymous()` check (security is handled by the PIN+face gate on the frontend)
- Currency: change all "DC" references to "INR" (₹) throughout frontend
- Task reward: admin can set a custom INR reward per task when updating it; reward shown on task card as "₹X"
- Withdrawal: user selects from fixed tiers only (not free-form input); only tiers ≤ their balance are enabled
- Task accessibility: user cannot open/start a task that has no image AND uses the default placeholder title

### Remove
- Free-form withdrawal amount entry

## Implementation Plan
1. Backend (main.mo): 
   - Add `reward: Nat` field to Task type
   - Update `updateTask` to accept `reward: Nat` param
   - Update `initTasks` to include `reward = 0`
   - Replace all `AccessControl.isAdmin(accessControlState, caller)` checks with `not caller.isAnonymous()` in: updateTask, reviewSubmission, getAllSubmissions, blockUser, unblockUser, addCoins, deductCoins, reviewPayment, updatePaymentStatus, getAllPayments, recordLastLogin admin check, getAllUsersAnalytics, deleteUser, clearAllData, freezeAccountForCheat, adminUpdateBankDetails
   - Keep `getUserSubmissions` auth as-is (user-only)

2. Frontend:
   - Update backend.d.ts: add `reward: bigint` to Task interface, update updateTask signature
   - Update useUpdateTask hook to pass reward param
   - AdminTaskRow: add reward input field (INR amount, numeric)
   - TaskCard: show "₹X" reward badge instead of "+10 DC"  
   - Replace all "DC" text with "INR" / "₹" across HomePage, ProfilePage, AdminPage
   - ProfilePage WithdrawalDialog: replace free-text amount with fixed tier buttons [10, 30, 50, 100, 150, 500, 750, 1200, 3000, 5000, 10000]; only enable tiers ≤ balance
   - HomePage/TaskCard: if task has no image AND title equals "Task N" (default), disable "Start Task" button and show "Coming Soon" state
   - Remove coinBalance bar "DC" suffix → "INR"
