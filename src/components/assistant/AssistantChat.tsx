import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, SendHorizonal, Sparkles } from "lucide-react";
import {
  ActionList,
  ConfidenceMeter,
  KindTag,
  Panel,
  PanelHeader,
  RiskChip,
  hazardLabel,
} from "@/components/common/primitives";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { cn } from "@/lib/utils";
import { formatDateTime, formatTime } from "@/lib/format";
import type { ChatMessage } from "@/types/mausam";

export function AssistantChat({ className }: { className?: string }) {
  const { mode, language, locationId, openVoice } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>(() => mausamApi.getInitialChat());
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: alerts } = useQuery({
    queryKey: queryKeys.alerts(locationId),
    queryFn: () => mausamApi.getAlerts(locationId),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setInput("");
    setPending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const reply = await mausamApi.postChat({ message: trimmed, mode, language, locationId });
      setMessages((prev) => [...prev, reply]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  };

  const prompts = mausamApi.getSuggestedPrompts(mode);

  return (
    <Panel raised className={cn("flex flex-col overflow-hidden", className)}>
      <PanelHeader
        title="MausamMitra assistant"
        sub={`Grounded on IMD + CWC feeds · ${mode} mode · ${language === "hi" ? "हिन्दी" : "English"}`}
        right={<Sparkles className="h-4 w-4 text-accent" strokeWidth={1.7} />}
      />

      <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-md border border-primary/35 bg-primary/12 px-3.5 py-2.5">
                <p className="text-sm leading-relaxed">{m.text}</p>
                <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          ) : (
            <AssistantBubble
              key={m.id}
              message={m}
              officialHeadline={
                alerts?.find((a) => a.id === m.officialWarningRef)?.headline ?? undefined
              }
            />
          ),
        )}

        {pending ? (
          <div className="panel-sunken inline-flex items-center gap-2 px-3 py-2">
            <span className="flex h-3 items-end gap-0.5" aria-hidden>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="animate-level h-3 w-[3px] origin-bottom rounded-full bg-accent"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Reading IMD + CWC feeds
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2.5">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            className="focus-ring rounded-sm border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-input hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <button
          type="button"
          onClick={openVoice}
          aria-label="Ask by voice"
          className="focus-ring panel-sunken flex h-10 w-10 items-center justify-center text-primary transition-colors hover:bg-secondary/50"
        >
          <Mic className="h-4 w-4" strokeWidth={2} />
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            language === "hi"
              ? "पूछें: आज शाम बारिश होगी?"
              : "Ask: will it rain today? can I travel at 6 PM?"
          }
          className="focus-ring panel-sunken h-10 flex-1 px-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="focus-ring flex h-10 items-center gap-2 rounded-md border border-primary/40 bg-primary/15 px-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary/25 disabled:opacity-40"
        >
          <SendHorizonal className="h-4 w-4" strokeWidth={2} />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </Panel>
  );
}

function AssistantBubble({
  message,
  officialHeadline,
}: {
  message: ChatMessage;
  officialHeadline?: string;
}) {
  return (
    <div className="panel-sunken px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <KindTag kind="mausammitra" />
        {message.riskLevel ? <RiskChip level={message.riskLevel} /> : null}
        {message.hazard ? (
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {hazardLabel[message.hazard]}
          </span>
        ) : null}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {formatTime(message.createdAt)}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-foreground/95">{message.text}</p>

      {message.facts?.length ? (
        <dl className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {message.facts.map((f) => (
            <div key={f.label} className="rounded-sm border border-border px-2 py-1.5">
              <dt className="label-meta">{f.label}</dt>
              <dd className="mt-0.5 font-mono text-xs">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {officialHeadline ? (
        <div
          className="mt-3 rounded-sm px-2.5 py-2"
          style={{
            border: "1px solid color-mix(in oklab, var(--official) 35%, transparent)",
            background: "color-mix(in oklab, var(--official) 9%, transparent)",
          }}
        >
          <KindTag kind="official" />
          <p className="mt-1.5 text-xs leading-snug text-foreground/90">{officialHeadline}</p>
        </div>
      ) : null}

      {message.actions?.length ? (
        <div className="mt-3">
          <p className="label-meta mb-1.5">Recommended actions</p>
          <ActionList actions={message.actions} />
        </div>
      ) : null}

      {message.citations?.length ? (
        <ul className="mt-3 space-y-1">
          {message.citations.map((c) => (
            <li key={c.label} className="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
              <span className="text-foreground/85">{c.label}</span>
              <span>· {c.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {message.provenance ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {message.provenance.model ?? "advisory engine"} · issued{" "}
            {formatDateTime(message.provenance.issuedAt)}
          </span>
          <span className="label-meta">Confidence</span>
          <ConfidenceMeter value={message.provenance.confidence} />
        </div>
      ) : null}
    </div>
  );
}
