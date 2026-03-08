# Dark Coin

## Current State

Full-stack task dashboard app on ICP. Users log in via Internet Identity, complete 6 tasks, upload proof screenshots, and request withdrawals. Admin panel at `/admin` (PIN + face auth). Backend tracks users, tasks, submissions, payments, bank details, analytics.

Key issues:
- `reviewPayment` fails: backend checks `request.status != #pending` but the variant comparison may fail due to how the SDK encodes variants — causes "Failed to update payment" error
- `PaymentRequest` has no `orderId` field — must be added
- No `deleteUser` or `clearUserData` admin functions
- After login, app doesn't force bank setup before other actions
- Account number maxLength is 18 in some places, but requirement is 17 digits
- All withdrawal records, task submissions, and coin balances need to be clearable (admin reset)

## Requested Changes (Diff)

### Add
- `orderId` field (Text, 12 digits) to `PaymentRequest` type — generated at request creation time using timestamp + random
- `deleteUser(userId)` backend function — removes user profile, analytics, and all their submissions/payments
- `clearAllData()` backend function — resets all submissions, payments, coin balances to zero (keeps user profiles and tasks)
- `adminResetCoins(userId)` — set a specific user's coin balance to 0
- Force bank account setup screen after first login if user has no bank details (before home screen is shown)
- 12-digit order ID shown in withdrawal history with a copy button

### Modify
- `reviewPayment`: fix the pending status check to use robust variant comparison (`String(request.status) == "pending"` pattern — in Motoko, use a switch on the status variant instead of `!=` comparison)
- `requestPayment`: embed a generated 12-digit orderId (timestamp-derived) into the PaymentRequest at creation
- Account number maxLength: enforce 17 digits max (not 18)
- Admin panel Users tab: add Delete Account and Clear Data buttons per user
- Admin panel: after clearing all data, invalidate all relevant queries
- Withdrawal history item: show order ID with copy-to-clipboard button

### Remove
- Nothing removed

## Implementation Plan

1. **Backend (Motoko)**:
   - Add `orderId: Text` to `PaymentRequest` type
   - Fix `reviewPayment` to use `switch` on status instead of `!=` comparison
   - In `requestPayment`, generate a 12-digit orderId from `Time.now()` modulo
   - Add `deleteUser(userId: Principal)` — removes from `userProfiles`, `userAnalytics`, filters out their submissions and payments
   - Add `clearAllData()` — clears all submissions map, all payment requests map, resets all coin balances to 0, resets nextSubmissionId and nextPaymentId
   - Keep `saveBankDetails` blocking re-save (permanent bank details)

2. **Frontend**:
   - Update `PaymentRequest` type in `backend.d.ts` to include `orderId: string`
   - Add `useDeleteUser` and `useClearAllData` hooks in `useQueries.ts`
   - `App.tsx`: after profile loads, if `profile.bankDetails` is null, show a forced BankSetup screen before home
   - `ProfilePage.tsx`: withdrawal history items show orderId + copy button; account number maxLength = 17
   - `AdminPage.tsx` Users tab: add Delete Account + Clear Data buttons in expanded user panel
   - `AdminPage.tsx` Payments tab: show orderId on each payment row
