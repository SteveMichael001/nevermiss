# OAuth Authentication Setup for Codex CLI & Claude Code

> Last updated: 2026-03-04  
> Purpose: Enable background sub-agents to use Codex CLI and Claude Code without raw API keys.

---

## TL;DR — Current State

| Tool | Version | Status | Auth Method |
|------|---------|--------|-------------|
| **Claude Code** | v2.1.50 | ✅ **Already logged in** | OAuth via claude.ai (Max plan) |
| **Codex CLI** | v0.98.0 | ❌ **Not logged in** | Needs ChatGPT OAuth login |

---

## Claude Code — Already Done ✅

Claude Code is already authenticated via OAuth.

### Verification
```bash
claude auth status
```
Output confirms:
- `loggedIn: true`
- `authMethod: "claude.ai"` (OAuth, not API key)
- `email: stevenchranowski3@gmail.com`
- `subscriptionType: "max"`

### Where credentials are stored
- **macOS Keychain** — service name: `"Claude Code-credentials"` (actual OAuth tokens)
- **`~/.claude.json`** — account metadata, org info, project settings (no raw tokens)

### Does `claude -p` work in background without ANTHROPIC_API_KEY?
**Yes.** Tested and confirmed:
```bash
echo "Say 'hello' in one word" | claude -p --model claude-haiku-4-5-20251001
# Output: Hello
```
No `ANTHROPIC_API_KEY` env var needed. OAuth token is pulled from keychain automatically.

### If you ever need to re-login
```bash
claude auth login
# Opens browser → logs into claude.ai → stores token in keychain
```

---

## Codex CLI — Action Required ❌

### Current state
```bash
codex login status
# Output: Not logged in
```
No credentials cached in `~/.codex/` or macOS keychain.

### Option A: Standard Browser Login (Recommended for Mac with display)
```bash
codex login
```
- Opens a browser window
- Sign in with ChatGPT account (same account as your ChatGPT subscription)
- After login, token is cached at `~/.codex/auth.json` (or OS keychain if configured)
- This is a **one-time interactive step** — background processes pick it up automatically

### Option B: Device Code Auth (Headless / No Browser)
If you're SSH'd in or can't use a browser:

1. **First**, enable device code auth in your ChatGPT account:
   - Go to: https://chatgpt.com → Settings → Security → Enable Device Code Login

2. **Then** run:
   ```bash
   codex login --device-auth
   ```
   - Shows a URL + one-time code in terminal
   - Open URL on any device with a browser, enter the code
   - Token gets cached locally — background processes pick it up

### Where Codex stores credentials
- **Default (auto):** macOS Keychain when available, falls back to `~/.codex/auth.json`
- **Force file storage:** Add to `~/.codex/config.toml`:
  ```toml
  cli_auth_credentials_store = "file"
  ```
  Then credentials live at `~/.codex/auth.json` — treat like a password

### Does `codex exec --full-auto` work in background without OPENAI_API_KEY?
**Yes — once OAuth login is complete.** Codex reads from `~/.codex/auth.json` or keychain automatically. No environment variable needed.

Test after login:
```bash
codex exec --full-auto "print hello world in python" 2>&1
```

---

## Background Sub-Agent Spawning — Summary

After completing Codex login, both tools work in background without raw API keys:

| Command | Works without API key? | Credential source |
|---------|------------------------|-------------------|
| `claude -p "prompt"` | ✅ Yes (already works) | macOS Keychain |
| `codex exec --full-auto "prompt"` | ✅ Yes (after login) | `~/.codex/auth.json` or Keychain |

### OpenClaw sub-agent spawning (coding-agent skill)
The skill spawns agents via `exec` with `pty: true`. Since credentials are stored in user-level files/keychain (not session env vars), they'll be available to any process running as `stevechranowskiaiworkspace`.

No changes needed to OpenClaw config — just complete the Codex login step.

---

## Quick Setup Checklist

- [x] Claude Code OAuth — **done**, `claude auth status` confirms active session
- [ ] Codex CLI OAuth — **run `codex login` interactively** (5 minutes)
  - Opens browser, sign in with ChatGPT, done
  - Verify with: `codex login status` → should say "Logged in"

---

## Troubleshooting

**Codex login fails / no browser opens:**
→ Try `codex login --device-auth` instead

**Claude token expires:**
→ Run `claude auth login` — it refreshes automatically during active sessions

**Background process can't find credentials:**
→ Confirm credential file: `ls ~/.codex/auth.json`  
→ Confirm keychain: `security find-generic-password -s "Claude Code-credentials"`

**Want to force Codex to use file storage (easier to debug):**
```bash
mkdir -p ~/.codex
echo 'cli_auth_credentials_store = "file"' >> ~/.codex/config.toml
codex login  # re-auth to write to file
```

---

## API Key Alternative (if OAuth causes issues)

If OAuth proves flaky for background processes, fallback is explicit API keys:

```bash
# In ~/.zshrc or ~/.zshenv (persists across sessions):
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

But this is unnecessary once OAuth is set up — prefer OAuth for Claude (already done) and after Codex login.
