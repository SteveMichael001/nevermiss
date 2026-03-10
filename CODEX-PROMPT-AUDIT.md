# Codex Overnight Audit — NeverMiss Full Codebase Review

You are a senior engineer doing a thorough pre-launch audit of the NeverMiss codebase.
Read PRD.md first. Your job is to make this production-ready without requiring any human input.

Do not change: design system, ElevenLabs agent config, Supabase schema (beyond adding columns already specified in migrations).

---

## Audit Scope

### 1. AI Slop Removal
Review every file for:
- Redundant or obvious comments ("// This function creates a client" — delete it)
- Over-engineered patterns for simple problems
- Dead code, unused imports, unreachable branches
- Inconsistent naming conventions — standardize
- Copy-pasted logic that should be extracted into shared utils
Clean it up. Less code is better code.

### 2. Error Handling Consistency
Every API route should follow this pattern:
- Return 200 to webhooks (Twilio, ElevenLabs, Stripe) even on errors — they retry on non-200
- Return proper 4xx/5xx to app-facing routes
- Log errors with `[route-name]` prefix for easy grep
- Never let an unhandled promise rejection silently fail
- Every `supabase.from().select()` call should handle the error case

Audit all routes in `apps/web/app/api/` and fix any that don't follow this.

### 3. Environment Variable Safety
Every `process.env.X!` (non-null assertion) in production code is a silent bomb.
Replace with proper guards:
```typescript
const value = process.env.SOME_VAR
if (!value) {
  console.error('[module] SOME_VAR not set')
  return // or throw in startup code
}
```
Do this for all runtime env var access outside of startup validation blocks.

### 4. Auth Consistency
Every dashboard API route (`/api/business`, `/api/calls`, `/api/billing`) must:
- Verify the authenticated user owns the resource they're accessing
- Return 401 if no session, 403 if not owner
- Never return data for a different user's business

Audit all routes and fix any that skip ownership checks.

### 5. Webhook Security
- Twilio voice/status webhooks: signature validation should be on by default in production. Verify `SKIP_TWILIO_VALIDATION` is only respected in dev.
- ElevenLabs webhook: HMAC validation is already correct — verify it hasn't been accidentally loosened.
- Stripe webhook: `constructEvent` is the right pattern — verify it's being used correctly.

### 6. Race Conditions & Idempotency
- The ElevenLabs post-call webhook could fire twice (ElevenLabs retries on non-200 AND on timeout). Add a unique constraint check: before inserting a call, check if `elevenlabs_conversation_id` already exists. If it does, return `{ received: true }` without re-processing.
- The Stripe webhook could fire `checkout.session.completed` twice. Make the business update idempotent (upsert or check before update).

### 7. Tech Debt Forecast
Create `TECH-DEBT.md` at repo root documenting:
- What's hardcoded that should be configurable (e.g., shared ElevenLabs agent ID)
- What's manual that should be automated (e.g., ElevenLabs agent per business for voice customization)
- What will break at scale (e.g., polling in test-view, no pagination on calls table)
- What's missing for a real production launch (monitoring, alerting, rate limiting)
- Estimate: low/medium/high effort for each item

### 8. PRD Update
**File: PRD.md**
Rewrite to accurately reflect current state as of this audit:
- Architecture diagram should match actual code
- All completed features marked complete
- Current blockers section accurate
- Roadmap updated with Sprint 1-3 items moved to done
- Tech stack table accurate

### 9. Quick Wins — Fix Without Asking
Fix any of the following if found:
- Missing `export const dynamic = 'force-dynamic'` on server components that read auth/DB
- Missing `try/catch` around Twilio API calls in onboarding provision route
- `NEXT_PUBLIC_APP_URL` still used anywhere after the fix — replace with the `VERCEL_URL` fallback pattern
- Any `console.log` of sensitive data (phone numbers, tokens, keys) — redact or remove
- TypeScript `any` types where the actual type is known — fix them
- Hardcoded `https://nevermiss-delta.vercel.app` strings that should use env vars

### 10. Final Check
After all changes:
- Run `pnpm typecheck` or `tsc --noEmit` in `apps/web/` — fix any TypeScript errors introduced
- Run `pnpm lint` if available — fix errors (not warnings)

---

## Output
- `TECH-DEBT.md` at repo root
- Updated `PRD.md`
- `AUDIT-REPORT.md` at repo root: what was found, what was fixed, what was left alone and why
- List every file changed
