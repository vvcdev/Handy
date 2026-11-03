/* eslint-disable i18next/no-literal-string */
// Fork-only (English only): everything for the Claude Code polisher lives on this tab.
import React, { useEffect, useState } from "react";
import { commands } from "@/bindings";
import { Alert } from "../../ui/Alert";
import { Button } from "../../ui/Button";
import {
  Dropdown,
  SettingContainer,
  SettingsGroup,
  Textarea,
  ToggleSwitch,
} from "@/components/ui";
import { ShortcutInput } from "../ShortcutInput";
import { PostProcessingSettingsPrompts } from "../post-processing/PostProcessingSettings";
import { useSettings } from "../../../hooks/useSettings";

const PROVIDER_ID = "claude_code";
const MODELS = [
  { value: "haiku", label: "Haiku (fastest)" },
  { value: "sonnet", label: "Sonnet (balanced)" },
  { value: "opus", label: "Opus (best, slowest)" },
];

export const ClaudeTranscribeSettings: React.FC = () => {
  const {
    settings,
    updateSetting,
    setPostProcessProvider,
    updatePostProcessModel,
    isUpdating,
  } = useSettings();
  const [cliFound, setCliFound] = useState<boolean | null>(null);
  const [sample, setSample] = useState(
    "um so like i was thinking we should uh meet tomorrow at three no wait four pm to discuss the the budget",
  );
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    void commands.checkClaudeCodeAvailable().then(setCliFound);
  }, []);

  const active =
    !!settings?.post_process_enabled &&
    settings?.post_process_provider_id === PROVIDER_ID;
  const model = settings?.post_process_models?.[PROVIDER_ID] || "haiku";

  const toggle = async (on: boolean) => {
    if (on) {
      await setPostProcessProvider(PROVIDER_ID);
      await updateSetting("post_process_enabled", true);
    } else {
      await updateSetting("post_process_enabled", false);
    }
  };

  const tryIt = async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const res = await commands.testClaudePolish(sample);
      if (res.status === "ok") setResult(res.data);
      else setError(res.error);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-6">
      <SettingsGroup title="Claude Transcribe">
        {cliFound === false && (
          <Alert variant="error" contained>
            Claude Code wasn't found. Install it and run `claude` once to log in
            with your subscription.
          </Alert>
        )}
        <ToggleSwitch
          checked={active}
          onChange={toggle}
          isUpdating={
            isUpdating("post_process_enabled") ||
            isUpdating("post_process_provider_id")
          }
          label="Polish dictation with Claude"
          description="Cleans up your transcript with Claude Code (your Claude subscription) before it's pasted. Use the shortcut below. If Claude fails, the raw transcript is pasted instead."
          descriptionMode="inline"
          grouped={true}
        />
        <ShortcutInput
          shortcutId="transcribe_with_post_process"
          descriptionMode="tooltip"
          grouped={true}
        />
        <SettingContainer
          title="Model"
          description="Haiku is fastest (about 2 seconds). Sonnet and Opus are slower but follow complicated prompts better."
          descriptionMode="tooltip"
          layout="horizontal"
          grouped={true}
        >
          <Dropdown
            options={MODELS}
            selectedValue={model}
            onSelect={(v) => void updatePostProcessModel(PROVIDER_ID, v)}
          />
        </SettingContainer>
      </SettingsGroup>

      <SettingsGroup title="Prompt">
        <PostProcessingSettingsPrompts />
      </SettingsGroup>

      <SettingsGroup title="Try it">
        <div className="p-3 space-y-3">
          <Textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            rows={3}
            className="w-full"
          />
          <Button
            onClick={tryIt}
            disabled={running || !sample.trim()}
            variant="primary"
            size="md"
          >
            {running ? "Polishing…" : "Polish with Claude"}
          </Button>
          {result && (
            <div className="text-sm rounded-md border border-line-strong p-2 whitespace-pre-wrap">
              {result}
            </div>
          )}
          {error && (
            <Alert variant="error" contained>
              {error}
            </Alert>
          )}
        </div>
      </SettingsGroup>
    </div>
  );
};
