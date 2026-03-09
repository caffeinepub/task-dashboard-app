# Dark Coin

## Current State
Full-stack task-reward app with Internet Identity auth, 6-task grid, proof uploads, admin panel (PIN+face gate), payments, withdrawals, AI chatbot, bank setup, anticheat. Backend uses Motoko with `AccessControl.hasPermission(#admin)` checks on all admin functions. Frontend sends raw file bytes to backend with no compression.

## Requested Changes (Diff)

### Add
- Client-side image compression using Canvas API before uploading task proof screenshots (reduce to under 1MB JPEG quality 0.7, max 1024px wide)

### Modify
- Backend: Remove `AccessControl.hasPermission(#admin)` checks from all admin functions. Replace with simple `not caller.isAnonymous()` checks or remove the check entirely. Affected functions: `getAllUsersAnalytics`, `getAllSubmissions`, `getAllPayments`, `blockUser`, `unblockUser`, `reviewSubmission`, `reviewPayment`, `updatePaymentStatus`, `updateTask`, `clearAllData`, `deleteUser`, `adminUpdateBankDetails`, `freezeAccountForCheat`, `addCoins`, `deductCoins`
- Frontend `TaskDetailSheet.tsx`: Add `compressImage()` helper that uses Canvas API to resize and compress image files before converting to `Uint8Array` for upload

### Remove
- Nothing

## Implementation Plan
1. Modify `src/backend/main.mo` — replace all `AccessControl.hasPermission(accessControlState, caller, #admin)` checks in admin-facing functions with `caller.isAnonymous()` guard (trap if anonymous). Security is handled by the frontend PIN+face gate.
2. Modify `src/frontend/src/components/app/TaskDetailSheet.tsx` — add `compressImage(file: File): Promise<File>` that uses `createImageBitmap` + Canvas 2D to resize to max 1024px and encode as JPEG quality 0.7 before reading as ArrayBuffer. Apply this compression in `handleSubmit` before the `FileReader` step. Only compress image files (not videos).
