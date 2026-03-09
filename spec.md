# Dark Coin

## Current State

Full-stack Dark Coin task app on ICP. Features: Internet Identity auth with redirect-based login via AuthClient popup (causes `postMessage null` error on mobile browsers), 6-task grid, proof uploads, admin panel at `/admin` with PIN + face blink detection, AI chat bot (asks for 6-digit unique ID), user profiles, bank account setup (forced on first login), withdrawal requests (fixed tiers), payment status flow (pending→approved→inPayment→transferred), anticheat freeze, user analytics, CCA live chat not yet implemented.

Known bugs identified in code review:
1. Login uses popup mode (`authClient.login`) — on mobile Chrome/Android the opener window reference is lost, causing `Cannot read properties of null (reading 'postMessage')`. Must switch to redirect-based flow.
2. Admin panel Proofs/Payments/Activity show user principal (truncated) — not unique ID.
3. Admin actions don't poll/re-fetch in user app — need 5-second polling on callerProfile, coinBalance, userPayments so changes reflect quickly.
4. AI chat bot has no order-ID lookup feature.
5. No "Connect with CCA" live chat button or chat page.
6. No bad-language detection/auto-freeze in chat.
7. Backend has no chat message storage for CCA feature.

## Requested Changes (Diff)

### Add
- **Redirect-based II login**: Switch `AuthClient.login` to use `redirectPath` option so the browser goes to II and comes back — eliminates postMessage error on mobile.
- **Unique ID in admin Proofs tab**: Each SubmissionRow shows the submitter's unique ID (looked up from analytics data) alongside their identifier.
- **Unique ID in admin Payments tab**: Each PaymentRow shows the payer's unique ID.
- **Unique ID in admin Activity tab**: Activity events show unique ID instead of truncated principal.
- **Fast polling in user app**: `callerProfile`, `coinBalance`, `userPayments` queries refetch every 5 seconds so admin changes appear near-instantly.
- **AI bot order ID lookup**: When user asks about withdrawal/order, bot can also ask for order ID and look up that specific payment from the user's payment list.
- **Connect with CCA button**: Gold "Connect with CCA" button in the app (separate from AI bot button). Opens a full chat page.
- **CCA User chat page**: User can type messages and send files to admin. Each message shows timestamp.
- **Admin Chat tab**: New "Chat" tab in admin panel. Shows all conversations grouped by user (with unique ID + account info). Admin can reply. Unread message badge.
- **Bad language auto-freeze**: If user sends a message in CCA chat containing sexual, hateful, suicide, or crime-related keywords, their account is frozen immediately and a warning shown.
- **Backend: chat messages**: New Motoko types/functions: `sendChatMessage(text, fileData?)`, `getChatMessages(userId)`, `getAllChats()`, `adminReplyToChat(userId, text)`, `markChatRead(userId)`.

### Modify
- `useInternetIdentity.ts`: Use redirect flow for login (detect callback URL param on return).
- `useQueries.ts`: Add `refetchInterval: 5000` to `useCallerProfile`, `useGetCoinBalance`, `useUserPayments`.
- `AIChatBot.tsx`: Add order-ID search flow; add "Connect with CCA" button distinct from AI bot.
- `AdminPage.tsx`: Add Chat tab; show unique ID in Proofs/Payments/Activity by cross-referencing analytics data.
- `backend.d.ts`: Add chat message types and methods.

### Remove
- Nothing removed.

## Implementation Plan

1. Update Motoko backend to add chat message storage (sendChatMessage, getAllChats, getChatMessages, adminReplyToChat, markChatRead) and regenerate backend.d.ts.
2. Fix useInternetIdentity.ts to use redirect-based login via window.location.href approach.
3. Update useQueries.ts to add fast polling on key user queries.
4. Update AdminPage.tsx to: show unique IDs in Proofs/Payments/Activity tabs, add new Chat tab.
5. Update AIChatBot.tsx to add order-ID lookup, add "Connect with CCA" button.
6. Create new CCAChat.tsx component for user live chat page.
7. Wire CCAChat into App.tsx (new route/tab).
8. Add bad-language detection in CCAChat message send handler.
9. Validate and deploy.
