# Dark Coin

## Current State
A mobile-first task earning app with Internet Identity auth, 6-task grid, proof-of-task uploads, withdrawal requests, and an admin panel accessible at `/admin` protected by PIN (09186114) + face scan. The backend uses Motoko with `AccessControl` for role-based permissions. The frontend uses React + Tailwind.

**Known issues:**
- Admin panel Users tab shows no registered users — `getAllUsersAnalytics()` requires `#admin` role but the admin has no ICP role assigned (they only pass the PIN+face gate).
- Admin panel Payments tab cannot load or manage payments — `getAllPayments()` and `reviewPayment()` also require `#admin` role.
- `reviewSubmission()`, `blockUser()`, `unblockUser()`, `updateTask()` similarly require `#admin` role and may fail.
- Bank account save fails — `saveBankDetails` traps with "User profile not found" when the profile is created via `ensureUserRegistered` (auto-register) but not yet available in some race conditions.
- Task cards look basic, need HD premium fintech redesign.

## Requested Changes (Diff)

### Add
- New backend helper: make all admin query/mutation functions accessible to ANY authenticated (non-anonymous) principal so the PIN+face gate in the frontend is the sole security layer.
- HD premium task card design with gradient headers, coin reward badge, numbered task indicator, and polished button styling.

### Modify
- Backend: Remove `AccessControl.hasPermission(... #admin)` check from `getAllUsersAnalytics`, `getAllPayments`, `getAllSubmissions`, `reviewPayment`, `reviewSubmission`, `blockUser`, `unblockUser`, `updateTask`, `addCoins`, `deductCoins`, `adminUpdateBankDetails`. Replace with a simple non-anonymous check.
- Backend: Fix `saveBankDetails` — when user profile is auto-registered (exists) but the save was called during transition, ensure the function checks `ensureUserRegistered` first and proceeds without trapping.
- Frontend TaskCard: Complete visual overhaul — HD glassmorphic card with gradient image overlay, gold coin reward badge, task number indicator, premium button styling with shimmer.

### Remove
- Nothing removed.

## Implementation Plan
1. Modify `main.mo`: change all admin-only functions to require only non-anonymous auth (not `#admin` role). This unblocks the admin panel from using all functions.
2. Fix `saveBankDetails` in `main.mo`: call `ensureUserRegistered` at the top, then proceed. Remove the "User profile not found" trap by creating a default profile if somehow still null.
3. Update `TaskCard.tsx`: redesign with gradient card header, task number badge, coin reward amount badge, HD image presentation, premium button with gold gradient.
4. Validate build (typecheck, lint, build).
5. Deploy.
