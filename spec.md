# Dark Coin

## Current State
- Internet Identity auth with profile setup, bank account setup flow (IFSC + account number)
- 6 task grid with glassmorphic cards, proof upload, task locking after submission
- Approved/Declined stamps on tasks
- Admin panel at `/admin` only, protected by 8-digit PIN (09186114) + 4-second auto-timer face scan
- Face scan uses a 4-second auto-timer after camera ready, then redirects to admin
- 5-tab admin panel: Tasks, Proofs, Users, Payments, Activity
- Users tab with search by email or principal ID, expandable user cards
- Payments: 5-stage flow (Pending → Approved → In Payment → Transferred → Declined)
- AI chatbot asks for principal ID to look up user data
- Admin panel shows principal ID per user
- Task 1 reward: 0 (not set)
- Persistent login: NOT fully implemented — app re-checks identity state on load via `useInternetIdentity` hook
- Task screenshot upload errors exist (error handling issues)

## Requested Changes (Diff)

### Add
- **6-digit unique user ID**: Generate a random 6-digit ID (e.g. 847291) for each user on first login, stored permanently. Never changes. Shown in user app (profile page) and in admin panel per user row.
- **Backend: `uniqueId` field** on `UserProfile` (nullable Text, generated on first profile creation/save)
- **Backend: `getUserByUniqueId(uid: Text)` query** so AI bot can look up user by unique ID
- **Eye-blink detection for admin face verification**: Replace the 4-second timer with real blink detection using MediaPipe FaceMesh or simple EAR (Eye Aspect Ratio) algorithm. Admin must blink 4 times (no time limit). Show live blink counter "Blinks: X/4" and face focus indicator. Only after 4 blinks complete, redirect to admin panel.
- **Task 1 reward set to ₹11** (hardcoded default in backend init or set via admin)

### Modify
- **AI chatbot**: Replace "please provide your principal ID" with "please provide your 6-digit unique ID". Bot uses `getUserByUniqueId` to fetch user data.
- **Admin panel Users tab**: Replace principal ID display with unique ID display per user. Search remains working (by email or unique ID now, not principal).
- **Admin face verification**: Remove 4-second timer. Replace with eye-blink counter (4 blinks required). Show "Blinks: X/4" counter. No redirect until 4th blink detected.
- **Persistent login**: Once user is logged in and has profile + bank details, do NOT show auth/profile/bank screens again on app reopen. Session persists via Internet Identity's own persistence (localStorage). On app load, skip splash/loading and go directly to home if already authenticated.
- **Task screenshot upload**: Fix error — ensure file is properly read as Uint8Array before calling `submitTask`. Add proper error handling and retry.
- **Task 1 reward**: Update initTasks to set task 0 (Task 1, id=0) reward to 11.

### Remove
- Principal ID visible display in user app and admin panel (keep internally for backend calls)
- 4-second face scan timer (replaced by blink detection)

## Implementation Plan
1. **Backend (Motoko)**:
   - Add `uniqueId: ?Text` field to `UserProfile`
   - In `ensureUserRegistered` and `saveCallerUserProfile`, generate a 6-digit unique ID if not already set (use timestamp + principal hash modulo 900000 + 100000)
   - Add `getUserByUniqueId(uid: Text): async ?{profile: UserProfile; userId: Principal}` query
   - Update `getAllUsersAnalytics` to include `uniqueId` in response
   - In `initTasks`, set task id=0 reward to 11
   - Update `getCallerUserProfile` to return profile with uniqueId

2. **Frontend — AdminAuthGate.tsx**:
   - Replace `FaceScreen` timer logic with EAR-based blink detection using canvas + requestAnimationFrame
   - Draw video frames to canvas, sample eye landmark regions for blink detection
   - Show "Blinks: X/4" counter overlay on video
   - Show face focus indicator (green/red outline)
   - No redirect until blinkCount === 4

3. **Frontend — AIChatBot.tsx**:
   - Change prompt: ask for 6-digit unique ID instead of principal ID
   - Call `getUserByUniqueId` backend function to look up user data

4. **Frontend — AdminPage.tsx**:
   - Replace principal ID display with unique ID in user rows and detail views
   - Update search to filter by email or unique ID

5. **Frontend — ProfilePage.tsx**:
   - Show unique ID on profile page (replacing principal ID display if any)

6. **Frontend — TaskDetailSheet.tsx / useSubmitTask**:
   - Fix screenshot upload error: properly convert File to Uint8Array using FileReader

7. **Frontend — App.tsx**:
   - Ensure persistent login: once `isAuthenticated && profile && bankDetails`, do not re-show setup screens. The Internet Identity hook already persists session in localStorage, so just ensure no unnecessary profile refetching triggers re-render to setup screens.
