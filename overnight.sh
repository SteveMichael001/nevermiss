#!/bin/zsh
set -e
cd ~/Projects/nevermiss

echo "=== [$(date)] SPRINT 3 START ===" 
codex exec -m gpt-5.4 --sandbox workspace-write "$(cat CODEX-PROMPT-SPRINT-3.md)"
echo "=== [$(date)] SPRINT 3 DONE ==="

echo "=== [$(date)] AUDIT START ==="
codex exec -m gpt-5.4 --sandbox workspace-write "$(cat CODEX-PROMPT-AUDIT.md)"
echo "=== [$(date)] AUDIT DONE ==="

echo "=== [$(date)] COMMITTING TO GITHUB ==="
git add -A
git commit -m "feat: sprint 3 + overnight audit — caller profile, ring preference, test call, codebase cleanup"
git push origin main
echo "=== [$(date)] PUSHED TO GITHUB ==="

echo "=== [$(date)] DEPLOYING TO VERCEL ==="
cd apps/web && vercel --prod
echo "=== [$(date)] DEPLOYED ==="
