import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatDateTime, pct, untilTime } from "@/lib/format";
import type { HazardType, Provenance, RiskLevel, ServiceHealth } from "@/types/mausam";

export const riskText: Record<RiskLevel, string> = {
  low: "text-risk-low",
  moderate: "text-risk-moderate",
  high: "text-risk-high",
  severe: "text-risk-severe",
};

export const riskVar: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  severe: "var(--risk-severe)",
};

export const riskLabel: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  severe: "Severe",
};

export const hazardVar: Record<HazardType, string> = {
  flood: "var(--flood)",
  heat: "var(--heat)",
  storm: "var(--storm)",
};

export const hazardLabel: Record<HazardType, string> = {
  flood: "Flood",
  heat: "Heat",
  storm: "Storm",
};

export function Panel({
  children,
  className,
  raised,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  raised?: boolean;
  as?: "section" | "div" | "article" | "aside";
}) {
  return <As className={cn(raised ? "panel-raised" : "panel", className)}>{children}</As>;
}

export function PanelHeader({
  title,
  sub,
  right,
  className,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h2>
        {sub ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

export function RiskChip({
  level,
  label,
  className,
}: {
  level: RiskLevel;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest",
        className,
      )}
      style={{
        color: riskVar[level],
        borderColor: `color-mix(in oklab, ${riskVar[level]} 45%, transparent)`,
        background: `color-mix(in oklab, ${riskVar[level]} 12%, transparent)`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: riskVar[level] }}
        aria-hidden
      />
      {label ?? riskLabel[level]}
    </span>
  );
}

export function KindTag({ kind }: { kind: "official" | "mausammitra" }) {
  const isOfficial = kind === "official";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
      style={{
        color: isOfficial ? "var(--official)" : "var(--advisory)",
        borderColor: `color-mix(in oklab, ${isOfficial ? "var(--official)" : "var(--advisory)"} 45%, transparent)`,
        background: `color-mix(in oklab, ${isOfficial ? "var(--official)" : "var(--advisory)"} 10%, transparent)`,
      }}
    >
      {isOfficial ? "Official warning" : "MausamMitra advisory"}
    </span>
  );
}

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="font-mono text-[11px] text-muted-foreground">{pct(value)}</span>
    </div>
  );
}

export function ProvenanceStrip({
  provenance,
  className,
}: {
  provenance: Provenance;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2",
        className,
      )}
    >
      <span className="label-meta">Source</span>
      <span className="min-w-0 flex-1 truncate text-xs text-foreground/85">
        {provenance.source}
        {provenance.model ? ` · ${provenance.model}` : ""}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">
        Issued {formatDateTime(provenance.issuedAt)}
      </span>
      <span className="font-mono text-[11px] text-muted-foreground">
        Valid {untilTime(provenance.validUntil)}
      </span>
      <ConfidenceMeter value={provenance.confidence} />
    </div>
  );
}

const healthVar: Record<ServiceHealth, string> = {
  online: "var(--risk-low)",
  degraded: "var(--risk-moderate)",
  offline: "var(--risk-severe)",
};

export function HealthDot({ health, pulse }: { health: ServiceHealth; pulse?: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden>
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: healthVar[health] }}
      />
      {pulse ? (
        <span
          className="animate-pulse-ring absolute inset-0 rounded-full"
          style={{ background: healthVar[health] }}
        />
      ) : null}
    </span>
  );
}

export function Metric({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="panel-sunken px-3 py-2.5">
      <p className="label-meta">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className="font-display text-2xl leading-none font-semibold tabular-nums"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </p>
      {sub ? <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function FactorBars({
  factors,
}: {
  factors: Array<{ label: string; value: string; weight: number }>;
}) {
  return (
    <ul className="space-y-2.5">
      {factors.map((f) => (
        <li key={f.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs text-foreground/90">{f.label}</span>
            <span className="font-mono text-[11px] text-muted-foreground">{f.value}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700"
                style={{ width: `${Math.round(f.weight * 100)}%` }}
              />
            </div>
            <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
              {Math.round(f.weight * 100)}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ActionList({ actions }: { actions: string[] }) {
  return (
    <ul className="space-y-1.5">
      {actions.map((a) => (
        <li key={a} className="flex gap-2 text-xs leading-relaxed text-foreground/90">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
          <span>{a}</span>
        </li>
      ))}
    </ul>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />;
}
