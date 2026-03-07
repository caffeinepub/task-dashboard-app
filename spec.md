# Task Dashboard App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Email + password authentication (Sign Up and Login screens)
- Secure user sessions stored in Motoko backend
- User Home Page with a 6-task grid (2 columns mobile, adapts on larger screens)
- Task Cards showing a task image, title, task status badge (Pending/Approved/Declined), and a "Start" button
- Task Detail view where users can upload a screenshot or video as proof of completion
- Submission flow: upload proof -> sent to Admin Panel for review
- Admin Panel (protected route, admin-only):
  - View and manage all 6 tasks (upload/change images, update titles)
  - View all user proof-of-task submissions
  - Approve or Decline each submission
  - Block or Unblock users
- User Profile screen (bottom nav tab)
- Bottom navigation bar for mobile (Home, Profile)
- Smooth page transitions

### Modify
None (new project).

### Remove
None (new project).

## Implementation Plan

### Backend (Motoko)
- User entity: id, email, hashed password, role (admin | user), blocked flag
- Session management: token-based session stored in backend
- Task entity: id, title, imageBlob (stored via blob-storage component), status
- Submission entity: id, userId, taskId, fileBlob (blob-storage), status (pending | approved | declined), timestamp
- Endpoints:
  - `signUp(email, password)` -> session token
  - `login(email, password)` -> session token
  - `logout(token)`
  - `getMe(token)` -> User
  - `getTasks()` -> [Task]
  - `submitProof(token, taskId, fileBlob)` -> Submission
  - `getMySubmissions(token)` -> [Submission]
  - `getAllSubmissions(token)` -> [Submission] (admin only)
  - `approveSubmission(token, submissionId)` (admin only)
  - `declineSubmission(token, submissionId)` (admin only)
  - `updateTask(token, taskId, title, imageBlob)` (admin only)
  - `blockUser(token, userId)` (admin only)
  - `unblockUser(token, userId)` (admin only)
  - `getAllUsers(token)` -> [User] (admin only)
  - Seed one admin account on first deploy

### Frontend (React + TypeScript + Tailwind)
- Auth screens: SignUp, Login (full-screen, mobile-first)
- Home screen: responsive task grid, task cards with image, title, status badge, Start button
- Task Detail sheet/modal: file upload (image/video), submit button, status feedback
- Admin Panel: task manager, submission reviewer, user manager tabs
- Profile screen: display user info, logout button
- Bottom navigation bar (Home, Profile) for mobile
- React Router for routing with protected routes
- Smooth CSS transitions between views
- Material Design-inspired: rounded corners, card shadows, clean typography
