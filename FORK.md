# Fork notes

This is a fork of [cjpais/Handy](https://github.com/cjpais/handy). It behaves
exactly like upstream, plus **one extra post-processing provider: "Claude Code"**,
which polishes dictation using your local `claude` CLI (your Claude
subscription, no API key).

## Using it
Open the **Claude Transcribe** tab in the sidebar: turn on "Polish dictation with Claude",
pick a model (`haiku` is fastest, ~2s), edit the prompt, and test it in the "Try it" box.
Dictate with the post-processing shortcut shown there. Requires Claude Code installed and
logged in. If Claude fails, Handy pastes the raw transcript as it always does.

## Updating (latest Handy + Claude)
```bash
./scripts/update-fork.sh
```
Merges `upstream/main`, checks the Claude hooks survived, builds, signs with a stable local
certificate ("Handy Fork Local", so macOS permissions are kept), quits Handy, installs to
`/Applications` and relaunches. The previous app is kept at `~/Desktop/Handy-previous.app`.
On a merge conflict it aborts without changing anything.

The in-app updater is pointed at this fork's releases (none exist) so it can never replace
the app with vanilla Handy. Use the script instead.

## Fork-only footprint (everything to re-check after an upstream merge)
- New files, never conflict: `src-tauri/src/claude_code.rs`,
  `src/components/settings/claude-transcribe/`, `scripts/update-fork.sh`, `FORK.md`
- Small hooks, all grep-able with `claude_code` / `ClaudeTranscribe`:
  `lib.rs`, `settings.rs`, `actions.rs`, `shortcut/mod.rs`, `commands/mod.rs`,
  `src/bindings.ts`, `Sidebar.tsx`, `usePostProcessProviderState.ts`,
  `PostProcessingSettings.tsx`, and the updater endpoint in `tauri.conf.json`
