import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Mic, Radio } from "lucide-react";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import { HealthDot } from "@/components/common/primitives";
import { ModeSelector } from "@/components/layout/ModeSelector";
import { LocationSelector } from "@/components/layout/LocationSelector";
import { SystemStatusPanel } from "@/components/layout/SystemStatusPanel";
import { VoiceConsole } from "@/components/voice/VoiceConsole";

const nav = [
  { to: "/", label: "Command Center" },
  { to: "/risk-map", label: "Risk Map" },
  { to: "/assistant", label: "AI Assistant" },
  { to: "/alerts", label: "Alerts" },
  { to: "/authority", label: "Authority Ops" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openVoice, voiceOpen } = useAppState();
  const { data: status } = useQuery({
    queryKey: queryKeys.status(),
    queryFn: mausamApi.getSystemStatus,
  });
  const [liveAt, setLiveAt] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => mausamApi.subscribeLive((p) => setLiveAt(p.at)), []);

  return (
    <div className="min-h-screen">
      <div className="grid-overlay pointer-events-none fixed inset-0 -z-10" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 lg:px-6">
          <Link to="/" className="focus-ring flex items-center gap-3 rounded-sm">
            <span className="panel-sunken relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-sm">
              <span
                className="animate-radar absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, color-mix(in oklab, var(--primary) 55%, transparent) 40deg, transparent 90deg)",
                }}
                aria-hidden
              />
              <Radio className="relative h-4 w-4 text-primary" strokeWidth={1.75} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold tracking-wide">
                MausamMitra
              </span>
              <span className="label-meta">Hazard advisory · SIH 26068</span>
            </span>
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
            <LocationSelector />
            <ModeSelector />
            <button
              type="button"
              onClick={() => setStatusOpen((v) => !v)}
              aria-expanded={statusOpen}
              className="focus-ring panel-sunken flex items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-secondary/50"
            >
              <HealthDot health={status?.overall ?? "offline"} pulse />
              <span className="hidden leading-tight sm:block">
                <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Backend
                </span>
                <span className="block text-[11px] font-medium capitalize">
                  {status?.overall ?? "checking"}
                  {status ? ` · ${status.latencyMs} ms` : ""}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={openVoice}
              className="focus-ring flex items-center gap-2 rounded-md border border-primary/40 bg-primary/15 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/25"
            >
              <Mic className="h-4 w-4" strokeWidth={2} />
              <span className="hidden sm:inline">Ask by voice</span>
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-[1600px] overflow-x-auto px-4 lg:px-6">
          <ul className="flex min-w-max items-center gap-1">
            {nav.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "focus-ring relative block px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "absolute inset-x-2 bottom-0 h-[2px] rounded-full transition-opacity",
                        active ? "bg-primary opacity-100" : "opacity-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {statusOpen && status ? (
        <div className="mx-auto max-w-[1600px] px-4 pt-4 lg:px-6">
          <SystemStatusPanel status={status} onClose={() => setStatusOpen(false)} />
        </div>
      ) : null}

      <main className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6 lg:py-6">{children}</main>

      <footer className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pb-8 lg:px-6">
        <span className="label-meta">Data pipeline</span>
        <span className="text-[11px] text-muted-foreground">
          IMD · CWC · INCOIS · NDMA feeds, fused by MausamMitra risk models
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          Live stream {liveAt ? relativeTime(liveAt) : "connected"}
          {status?.offlineCacheReady ? " · offline cache ready" : ""}
        </span>
      </footer>

      {voiceOpen ? <VoiceConsole /> : null}
    </div>
  );
}
