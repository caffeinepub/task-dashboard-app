# Dark Coin

## Current State
No existing codebase. This is a new project.

## Requested Changes (Diff)

### Add
- Internet Identity authentication with a post-login splash screen (3-4 seconds, Dark Coin logo + loading animation, fade-in transition to home)
- Welcome message on login screen with professional fintech/crypto UI
- Home page with 6-task grid (glassmorphism cards, mobile-first, no excessive scroll)
- Each task card: image, title, status badge (Pending/Approved/Declined), Start button
- Proof submission: bottom sheet for uploading screenshot/video as proof
- Admin panel with 5 sections:
  - User Management: list all registered users, freeze/unfreeze accounts
  - Task Management: upload/edit 6 task images and start button links
  - Verification System: approve/decline user proof submissions
  - Payment Processing: accept/decline withdrawal requests
  - Analytics: last login, tasks completed, stored data per user
- Bottom navigation: Home, Profile, Admin

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

**Backend (Motoko):**
- User registry: store principal, display name, email, freeze status, last login, join date
- Task registry: 6 tasks with title, image blob, start link, ordering
- Submission store: user proof uploads (blob reference, task ID, status: pending/approved/declined, timestamp)
- Withdrawal requests: user ID, amount, status (pending/accepted/declined), timestamp
- Admin role check: hardcode first principal as admin or use authorization component
- Queries: getAllUsers, getUser, getTasks, getTask, getUserSubmissions, getAllSubmissions, getWithdrawals, getUserAnalytics
- Updates: registerUser, updateUser, freezeUser, unfreezeUser, updateTask, submitProof, updateSubmissionStatus, requestWithdrawal, updateWithdrawalStatus

**Frontend:**
- Auth flow: II login -> splash screen (logo + spinner, 3-4s) -> fade into home
- Login page: premium dark design, welcome copy, II button
- Home page: 2-col mobile grid of 6 glassmorphism task cards
- Task card: image/placeholder, title, status badge, Start button (opens proof sheet)
- Proof upload sheet: file input (image/video), submit button
- Profile page: display name, email, stats (tasks completed, pending)
- Admin panel (/admin): tabs for Users, Tasks, Submissions, Payments, Analytics
- Bottom nav with Home, Profile, Admin icons
