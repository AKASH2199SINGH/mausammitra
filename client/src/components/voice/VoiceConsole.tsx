import { useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";
import {
  ActionList,
  ConfidenceMeter,
  KindTag,
  Panel,
  PanelHeader,
  RiskChip,
} from "@/components/common/primitives";
import { mausamApi } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { cn } from "@/lib/utils";
import type { ChatMessage, Language } from "@/types/mausam";

type VoiceState = "idle" | "listening" | "processing" | "response";

const stateCopy: Record<VoiceState, { label: string; hint: string }> = {
  idle: { label: "Tap to speak", hint: "Hindi and English supported" },
  listening: { label: "Listening…", hint: "Speak naturally, then pause" },
  processing: { label: "Processing…", hint: "Transcribing and grounding on live feeds" },
  response: { label: "Response ready", hint: "Spoken reply generated" },
};

export function VoiceConsole() {
  const { closeVoice, language, setLanguage, mode, locationId } = useAppState();
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = async () => {
    if (state === "listening" || state === "processing") return;
    setTranscript(null);
    setReply(null);
    setError(null);
    setState("listening");
    timers.current.push(
      setTimeout(async () => {
        setState("processing");
        try {
          const asr = await mausamApi.transcribeVoice(language);
          setTranscript(asr.text);
          const answer = await mausamApi.postChat({
            message: asr.text,
            mode,
            language,
            locationId,
          });
          setReply(answer);
          setState("response");
        } catch (cause) {
          // Previously the rejection escaped, so the console sat on "Processing…"
          // forever with no way to recover.
          setError(
            cause instanceof Error ? cause.message : "Voice request failed, please try again.",
          );
          setState("idle");
        }
      }, 2200),
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-3 backdrop-blur-sm sm:items-center">
      <Panel raised className="w-full max-w-xl overflow-hidden">
        <PanelHeader
          title="Voice assistant"
          sub="Server-side ASR + grounded reply · POST /voice/transcribe"
          right={
            <button
              type="button"
              onClick={closeVoice}
              aria-label="Close voice assistant"
              className="focus-ring rounded-sm p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          }
        />

        <div className="flex items-center justify-center gap-1.5 border-b border-border px-4 py-2.5">
          {(["en", "hi"] as Language[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguage(l)}
              aria-pressed={language === l}
              className={cn(
                "focus-ring rounded-sm border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                language === l
                  ? "border-primary/45 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {l === "en" ? "English" : "हिन्दी"}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3 px-4 py-6">
          <button
            type="button"
            onClick={run}
            aria-label="Start voice input"
            className="focus-ring relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/45 bg-primary/12 transition-transform active:scale-95"
          >
            {state === "listening" ? (
              <>
                <span className="animate-pulse-ring absolute inset-0 rounded-full bg-primary/35" />
                <span
                  className="animate-pulse-ring absolute inset-0 rounded-full bg-primary/25"
                  style={{ animationDelay: "0.8s" }}
                />
              </>
            ) : null}
            <Mic className="relative h-8 w-8 text-primary" strokeWidth={1.8} />
          </button>

          {state === "listening" ? (
            <div className="flex h-8 items-end gap-1" aria-hidden>
              {Array.from({ length: 13 }).map((_, i) => (
                <span
                  key={i}
                  className="animate-level w-[3px] origin-bottom rounded-full bg-accent"
                  style={{ height: `${10 + ((i * 7) % 22)}px`, animationDelay: `${i * 0.07}s` }}
                />
              ))}
            </div>
          ) : null}

          <p className="font-display text-lg font-semibold">{stateCopy[state].label}</p>
          <p className="text-xs text-muted-foreground">{stateCopy[state].hint}</p>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="flex w-full items-center gap-1.5">
            {(["listening", "processing", "response"] as VoiceState[]).map((s, i) => {
              const order: VoiceState[] = ["idle", "listening", "processing", "response"];
              const done = order.indexOf(state) > i;
              const activeStep = state === s;
              return (
                <div key={s} className="flex-1">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      activeStep || done ? "bg-primary" : "bg-muted",
                    )}
                  />
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {transcript ? (
          <div className="border-t border-border px-4 py-3">
            <p className="label-meta">Transcript</p>
            <p className="mt-1 text-sm">{transcript}</p>
          </div>
        ) : (
          <div className="border-t border-border px-4 py-3">
            <p className="label-meta">Try saying</p>
            <ul className="mt-1 space-y-0.5">
              {mausamApi.getSampleUtterances(language).map((s) => (
                <li key={s} className="text-xs text-muted-foreground">
                  “{s}”
                </li>
              ))}
            </ul>
          </div>
        )}

        {reply ? (
          <div className="space-y-3 border-t border-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <KindTag kind="mausammitra" />
              {reply.riskLevel ? <RiskChip level={reply.riskLevel} /> : null}
              {reply.provenance ? (
                <ConfidenceMeter value={reply.provenance.confidence} className="ml-auto" />
              ) : null}
            </div>
            <p className="text-sm leading-relaxed">{reply.text}</p>
            {reply.actions?.length ? <ActionList actions={reply.actions} /> : null}
            <p className="font-mono text-[10px] text-muted-foreground">
              Spoken back in {language === "hi" ? "हिन्दी (hi-IN)" : "English (en-IN)"} ·{" "}
              {reply.provenance?.source}
            </p>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
