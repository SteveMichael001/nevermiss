# NeverMiss — Task Board

**Orchestrator:** James  
**Last updated:** 2026-03-09  
**Status:** Paused — Steve on BridgeSource work

---

## 🔴 BLOCKED — Waiting on Steve

### Twilio Toll-Free Verification
- [ ] **Create new Customer Profile** at https://console.twilio.com/us1/develop/trusthub/customer-profiles
  - Type: Sole Proprietor
  - Name: Steve Chranowski
  - Website: https://nevermiss-delta.vercel.app
- [ ] **Submit Toll-Free Verification** for +18339015846
- [ ] **Wait 1-3 business days** for approval
- [ ] Once approved, test SMS delivery

**Until verified:** Voice/AI answering works. SMS notifications blocked by carriers.

---

## ✅ Completed (Mar 8, 2026)

- [x] Landing page — Apple-style B&W design (live)
- [x] Onboarding flow simplified to 4 steps (setup → number → payment → complete)
- [x] Dashboard with call log, settings, billing pages
- [x] Supabase auth fixed (redirect URL updated)
- [x] Database tests passing (businesses + calls tables)
- [x] Twilio API connection working
- [x] Purchased toll-free number +18339015846 for SMS
- [x] Updated SMS code to use toll-free number
- [x] Cleaned up stale workspace docs
- [x] Archived old design docs (dark teal theme)
- [x] Created CURRENT-DESIGN.md

---

## 🟡 Ready to Build (after SMS unblocked)

### Onboarding Polish
- [ ] Test full onboarding flow end-to-end
- [ ] Stripe Checkout integration test
- [ ] Number provisioning API (currently mocked)

### Dashboard Polish
- [ ] Call detail view with full transcript
- [ ] Audio playback (if recording available)
- [ ] Empty state improvements

### Voice Quality
- [ ] Phase 1 — ElevenLabs settings (spelling_patience, turn_eagerness)
- [ ] Phase 2 — ASR keyword injection per trade

### Marketing
- [ ] FB ads creative production
- [ ] Campaign setup ($500-750 test)

---

## 📍 Key URLs & Info

**Production:** https://nevermiss-delta.vercel.app  
**Repo:** https://github.com/SteveMichael001/nevermiss  
**Supabase:** https://fibauzdvzkfevabxyhkt.supabase.co

**Phone Numbers:**
- +16196482491 — Voice (ElevenLabs AI answering)
- +18339015846 — SMS (toll-free, pending verification)

**Design System:** Apple-style B&W. See `apps/web/app/globals.css`  
- nm-black: #000000
- nm-white: #ffffff  
- nm-gray: #858484
- No accent colors

---

## Resume Instructions

When Steve returns to NeverMiss:
1. Check if toll-free verification approved
2. Test SMS delivery
3. Run full onboarding flow test
4. Pick next priority from Ready to Build
