# Dark Coin

## Current State
- Full-stack app with Motoko backend and React frontend
- Internet Identity auth, 6-task grid, proof upload/review system
- Admin panel at /admin (PIN + face scan gate)
- PaymentRequest system: users submit withdrawal requests, admin accepts/declines — but balance is NOT deducted on acceptance
- Withdrawal dialog has "amount" + "wallet address" fields (both free-form)
- No bank details storage on backend
- No anticheat system
- Screenshot upload errors are not surfaced clearly to the user
- UserProfile has: email, role, isBlocked, coinBalance (no bank details)

## Requested Changes (Diff)

### Add
- Backend: `BankDetails` type: `{ ifscCode: Text; bankName: Text; accountNumber: Text }`
- Backend: `bankDetails` field on `UserProfile` (optional, stored permanently once set)
- Backend: `saveBankDetails(ifsc, bankName, accountNumber)` — can only be called once by user; subsequent calls rejected
- Backend: `adminUpdateBankDetails(userId, ifsc, bankName, accountNumber)` — admin-only override
- Backend: `getBankDetails(userId)` — returns bank details for a user
- Backend: anticheat `freezeAccountForCheat(userId)` — marks account as frozen with cheat flag
- Backend: `deductCoins` call inside `reviewPayment` when `approve = true` — deduct request amount from user balance
- Frontend: anticheat detection hook — monitors rapid repeated actions, devtools open, JS injection patterns; calls backend freeze within 2 seconds of detection; shows freeze screen
- Frontend: withdrawal dialog replaces wallet address with bank account flow: IFSC input → auto-fetch bank name from public IFSC API → account number input; amount is fixed to user's current coin balance (not editable)
- Frontend: if bank details already saved, withdrawal dialog shows saved bank name + masked account, cannot be edited by user
- Frontend: admin Users tab — expanded user card shows bank details section with editable fields + save button (admin can always update)

### Modify
- Backend: `UserProfile` type — add optional `bankDetails` field
- Backend: `reviewPayment` — when `approve = true`, call deductCoins for the request amount
- Backend: `requestPayment` — validate that user's coinBalance >= amount before creating request
- Frontend: ProfilePage withdrawal dialog — remove wallet address field, remove editable amount field; show fixed amount equal to current coin balance; add IFSC/bank/account flow
- Frontend: TaskDetailSheet / screenshot upload — improve error handling so backend errors surface as toast messages
- Frontend: useReviewPayment mutation — invalidate coinBalance query on success so balance updates in UI

### Remove
- Frontend: wallet address input from withdrawal dialog
- Frontend: free-form amount input from withdrawal dialog (replaced by fixed coin balance amount)

## Implementation Plan
1. Update `main.mo`:
   - Add `BankDetails` type and optional field to `UserProfile`
   - Add `saveBankDetails`, `adminUpdateBankDetails`, `getBankDetails` functions
   - Fix `reviewPayment` to deduct coins when approved
   - Fix `requestPayment` to validate balance >= amount
   - Add `freezeAccountForCheat` function
2. Update `backend.d.ts` to reflect new types and functions
3. Update `useQueries.ts`: add hooks for bank details, freeze, fix reviewPayment invalidation
4. Update `ProfilePage.tsx`: new withdrawal dialog (fixed amount = coin balance, IFSC flow, permanent bank save)
5. Create `useAnticheat.ts` hook: devtools detection, rapid-action detection, triggers freeze + shows frozen screen
6. Update `App.tsx` / `HomePage.tsx`: mount anticheat hook for authenticated users
7. Update `AdminPage.tsx`: add bank details edit section in expanded user card
8. Fix `TaskDetailSheet.tsx`: surface upload errors as toasts
