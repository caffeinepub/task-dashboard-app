# Dark Coin

## Current State
- Full-stack app with Motoko backend and React frontend
- Internet Identity authentication with profile setup
- 6-task grid on home page, glassmorphic dark UI
- Admin panel at /admin with PIN + face scan gate
- Admin has 5 tabs: Tasks, Proofs, Users, Payments, Analytics
- Users tab shows only users who have submitted tasks (derived from submissions list)
- Analytics tab shows basic user stats (lastLogin, tasksCompleted, totalSubmissions)
- No user activity log / live event feed
- No withdrawal request UI for users
- Users list in admin is limited to those who have submitted at least one task

## Requested Changes (Diff)

### Add
- **Activity tracking**: When user logs in or starts a task, record an activity event in the backend (event type, timestamp, userId, taskId if applicable)
- **getAllUsers backend call**: Return all registered users (not just those with submissions), including their profile, analytics, submissions, and payments
- **getUserDetail backend call**: Return full account info + usage stats + all submissions + all payments for a single user
- **Withdrawal request UI**: A "Withdraw" button/section on the home page or profile page where users can enter an amount and submit a withdrawal request
- **Admin: Enhanced Users tab**: Show ALL registered users (from getAllUsers), with expandable user detail cards showing their profile info, usage stats, submission history, and withdrawal history in one unified view
- **Admin: User detail panel**: Clicking a user opens a detail view with: display name, email, principal ID, join date, last login, tasks started, tasks completed, coin balance, account status, full submission list, full withdrawal list; Admin can freeze/unfreeze, approve/decline withdrawals inline
- **Admin: Activity feed tab**: New "Activity" tab showing real-time activity log entries (user logged in, user started task X, user submitted task X, user requested withdrawal) sorted by timestamp descending

### Modify
- **Backend: recordLastLogin** — also record an activity event
- **Backend: submitTask** — also record an activity event (task started + task submitted)
- **Backend: getAllUsersAnalytics** — extend to include coinBalance, isBlocked, joinDate
- **Backend: add tasksStarted counter** to user analytics
- **Admin Users tab** — replace the current submission-derived user list with a full user list using getAllUsers

### Remove
- Nothing removed

## Implementation Plan
1. Update Motoko backend:
   - Add `ActivityEvent` type: { id, userId, eventType (#login | #taskStarted | #taskSubmitted | #withdrawalRequested), taskId?: Nat, timestamp: Int }
   - Add `activityLog` map and `nextActivityId` counter
   - Add `recordActivity(caller, eventType, taskId?)` private helper
   - Add `joinDate` field to UserProfile (set on first registration)
   - Add `tasksStarted` field to userAnalytics
   - Update `ensureUserRegistered` to set joinDate
   - Update `recordLastLogin` to also record #login activity
   - Update `submitTask` to record #taskStarted and #taskSubmitted activity, and increment tasksStarted
   - Update `requestPayment` to record #withdrawalRequested activity
   - Add `getAllActivityLog()` query returning all activity events sorted by timestamp desc
   - Add `getUserActivityLog(userId)` query for user-specific activity
   - Update `getAllUsersAnalytics` to include coinBalance, isBlocked, joinDate, tasksStarted
   - Add `getAllUsers()` query returning full user list with profile + analytics data
   - Add `getUserDetail(userId)` query returning profile + analytics + submissions + payments

2. Update frontend:
   - Add `useRequestPayment` mutation hook to useQueries.ts
   - Add `useGetAllUsers` query hook
   - Add `useGetUserDetail` query hook
   - Add `useGetAllActivity` query hook
   - Add `useRecordTaskStart` mutation to track when user taps "Start Task"
   - Add withdrawal request UI on HomePage (a "Withdraw" button in the coin balance bar that opens a sheet with amount input and submit)
   - Update Admin Users tab to use getAllUsers instead of deduplicating from submissions; show expandable user detail cards
   - Add Admin Activity tab (6th tab) with live activity feed
   - Call recordActivity (via recordLastLogin extension) on login
   - Call a new `recordTaskStart` mutation when user taps "Start Task"
