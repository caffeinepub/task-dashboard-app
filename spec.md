# Dark Coin

## Current State
- Full app with Internet Identity auth, 6-task grid, and admin panel at `/admin`
- Admin panel is directly accessible after login with no extra protection
- App.tsx renders AdminPage when user clicks Admin tab or navigates to /admin
- SplashScreen shown post-login for 3.5 seconds
- Electric Gold dark theme with glassmorphic cards

## Requested Changes (Diff)

### Add
- AdminAuthGate component that intercepts access to AdminPage
- Step 1: 6-digit PIN entry screen (code: 09186114) with styled OTP-style input
- Step 2: Face verification screen — activates device camera for 4 seconds, shows scanning animation (human/bot detection UI), then marks as verified
- On successful PIN + face verify → session flag set → AdminPage rendered
- Session resets when admin navigates away (back to home)

### Modify
- App.tsx: wrap AdminPage render with AdminAuthGate; gate resets on handleBackFromAdmin

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/app/AdminAuthGate.tsx`
   - State machine: `"pin" | "face" | "verified"`
   - PIN screen: OTP-style 8-digit input (styled electric-gold), validate against "09186114", show error on wrong code
   - Face screen: access webcam via getUserMedia, show live video feed, overlay scanning ring animation for 4 seconds, progress bar, "Analyzing face..." text, then auto-advance to verified
   - Transition to AdminPage on verified
2. Update App.tsx: replace direct `<AdminPage>` render with `<AdminAuthGate onBack={handleBackFromAdmin} />` which internally shows AdminPage when verified; reset auth state on back
