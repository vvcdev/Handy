#!/usr/bin/env bash
# Fork-only. Pulls the latest upstream Handy into this fork, rebuilds, and
# installs it over /Applications/Handy.app. The Claude Transcribe feature is
# kept, so the new app is "latest Handy + Claude".
#
#   ./scripts/update-fork.sh            merge upstream, build, install
#   ./scripts/update-fork.sh --no-pull  just rebuild + install this checkout
set -euo pipefail

BRANCH="claude-code-polisher"
IDENTITY="Handy Fork Local"   # stable local cert so macOS permissions survive updates
BACKUP="$HOME/Desktop/Handy-previous.app"

cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:/opt/homebrew/bin:$PATH" CMAKE_POLICY_VERSION_MINIMUM=3.5

if [[ "${1:-}" != "--no-pull" ]]; then
  [[ "$(git rev-parse --abbrev-ref HEAD)" == "$BRANCH" ]] || { echo "Switch to the $BRANCH branch first."; exit 1; }
  [[ -z "$(git status --porcelain --untracked-files=no)" ]] || { echo "Commit or stash your changes first."; exit 1; }
  git fetch upstream
  if git merge --no-edit upstream/main; then
    echo "Merged upstream."
  else
    git merge --abort
    echo "Merge conflict with upstream. Nothing was changed."
    echo "Conflicts are only ever in the files listed in FORK.md; ask Claude Code to resolve them."
    exit 1
  fi
fi

# Make sure the Claude feature survived the merge before spending time building.
for f in src-tauri/src/claude_code.rs; do [[ -f $f ]] || { echo "Missing $f"; exit 1; }; done
for f in src-tauri/src/actions.rs src-tauri/src/settings.rs src-tauri/src/lib.rs src/components/Sidebar.tsx; do
  grep -q "claude_code\|ClaudeTranscribe" "$f" || { echo "Claude hook missing from $f after merge"; exit 1; }
done

# Dedicated keychain holding the throwaway local signing cert (no real secret).
KC="$HOME/Library/Keychains/handyfork.keychain-db"
security unlock-keychain -p handyfork "$KC" 2>/dev/null || true
security find-identity -p codesigning | grep -q "$IDENTITY" || { echo "Signing cert '$IDENTITY' not found in your keychain."; exit 1; }

bun install
mkdir -p src-tauri/resources/models
[[ -f src-tauri/resources/models/silero-vad-v6.2-F32.gguf ]] || curl -L -o src-tauri/resources/models/silero-vad-v6.2-F32.gguf \
  https://huggingface.co/handy-computer/silero-vad-v6.2-gguf/resolve/main/silero-vad-v6.2-F32.gguf

bun run tauri build --bundles app --config \
  "{\"bundle\":{\"createUpdaterArtifacts\":false,\"macOS\":{\"signingIdentity\":\"$IDENTITY\"}}}"

NEW="src-tauri/target/release/bundle/macos/Handy.app"
[[ -d $NEW ]] || { echo "Build did not produce $NEW"; exit 1; }

echo "Installing..."
osascript -e 'tell application "Handy" to quit' 2>/dev/null || true
for _ in $(seq 1 15); do pgrep -x handy >/dev/null || break; sleep 1; done
rm -rf "$BACKUP"
[[ -d /Applications/Handy.app ]] && mv /Applications/Handy.app "$BACKUP"
cp -R "$NEW" /Applications/Handy.app
xattr -dr com.apple.quarantine /Applications/Handy.app 2>/dev/null || true
open /Applications/Handy.app
echo "Done. Previous version saved at $BACKUP"
