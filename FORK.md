# Fork notes

This is a fork of [cjpais/Handy](https://github.com/cjpais/handy). It behaves
exactly like upstream, plus **one extra post-processing provider: "Claude Code"**,
which polishes dictation using your local `claude` CLI (your Claude
subscription, no API key).

## Using it
Settings → Post Processing → Provider → **Claude Code**. Pick a model alias
(`haiku` is fastest, ~2s). Use the "transcribe with post-processing" shortcut.
Requires Claude Code installed and logged in. If it fails, Handy pastes the raw transcript
as it always does.

## Fork-only footprint (everything to re-check after an upstream merge)
- `src-tauri/src/claude_code.rs` — the whole feature (new file, never conflicts)
- one-line/small hooks, all grep-able with `claude_code`:
  `lib.rs`, `settings.rs`, `actions.rs`, `shortcut/mod.rs`, `commands/mod.rs`,
  `src/bindings.ts`, `usePostProcessProviderState.ts`, `PostProcessingSettings.tsx`

## Pulling in upstream updates
```bash
git checkout claude-code-polisher
git fetch upstream
git merge upstream/main
bun install && bun run tauri build --bundles app
```
The fork work is a single small commit on the `claude-code-polisher` branch. If a
merge conflicts it will be in one of the hook files above and is trivial to resolve.
If `src/bindings.ts` conflicts, take upstream's and re-add `checkClaudeCodeAvailable`
(or run `bun run tauri dev` once; it regenerates the bindings).
