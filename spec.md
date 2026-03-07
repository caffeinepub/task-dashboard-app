# Dark Coin

## Current State
Full app is built with:
- Internet Identity auth with profile setup (display name + email)
- 6-task grid with glassmorphic cards, proof upload, status badges
- Admin panel protected by 8-digit PIN (09186114) + 4-second face scan
- Admin tabs: Tasks, Submissions, Users, Payments, Analytics
- Electric gold dark theme, splash screen, bottom nav

## Requested Changes (Diff)

### Add
- Backend: `ensureUserRegistered` helper that auto-registers any non-anonymous caller as `#user` if they are not yet in the access control system
- Backend: `saveCallerUserProfile` must call `ensureUserRegistered` before the permission check so new users can save their profile without hitting a trap
- Backend: `getCallerUserProfile` must NOT trap for unregistered users — just return `null` for unknown callers (skip permission check for this query, only block anonymous)

### Modify
- Backend: Remove the `hasPermission` guard from `getCallerUserProfile` — replace with a simple anonymous check so new users can call it before they're registered
- Backend: `saveCallerUserProfile` calls `ensureUserRegistered(caller)` first, then proceeds

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate Motoko backend with `ensureUserRegistered` helper and updated `getCallerUserProfile` + `saveCallerUserProfile` functions
2. Keep all existing functionality: tasks, submissions, user management, payments, analytics, block/unblock
3. Frontend stays unchanged — the fix is purely backend
