import { AlertTriangle, BellRing } from "lucide-react";
import {
  ConfidenceMeter,
  KindTag,
  Panel,
  PanelHeader,
  SkeletonBlock,
  hazardLabel,
  hazardVar,
} from "@/components/common/primitives";
import { formatDateTime, relativeTime, untilTime } from "@/lib/format";
import type { AlertSeverity, HazardAlert } from "@/types/mausam";

const severityVar: Record<AlertSeverity, string> = {
  advisory: "var(--risk-low)",
  watch: "var(--risk-moderate)",
  warning: "var(--risk-high)",
  emergency: "var(--risk-severe)",
};

export function AlertRow({ alert, dense }: { alert: HazardAlert; dense?: boolean }) {
  return (
    <article
      className="panel-sunken px-3.5 py-3"
      style={{ borderLeft: `2px solid ${severityVar[alert.severity]}` }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <KindTag kind={alert.kind} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.14em]"
          style={{ color: severityVar[alert.severity] }}
        >
          {alert.severity}
        </span>
        <span
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest"
          style={{ color: hazardVar[alert.hazard] }}
        >
          {hazardLabel[alert.hazard]}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {relativeTime(alert.issuedAt)} · expires in {untilTime(alert.validUntil)}
        </span>
      </div>

      <h3 className="mt-2 text-sm leading-snug font-semibold text-foreground">{alert.headline}</h3>
      {!dense ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{alert.body}</p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="label-meta">Areas</span>
        <span className="text-[11px] text-foreground/85">{alert.areas.join(" · ")}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="label-meta">Source</span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/85">
          {alert.source}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          Valid till {formatDateTime(alert.validUntil)}
        </span>
        <ConfidenceMeter value={alert.confidence} />
      </div>
    </article>
  );
}

export function OfficialWarningBanner({ alert }: { alert?: HazardAlert }) {
  if (!alert) return null;
  return (
    <div
      className="panel flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
      style={{
        borderColor: "color-mix(in oklab, var(--official) 40%, transparent)",
        background:
          "linear-gradient(90deg, color-mix(in oklab, var(--official) 14%, transparent), var(--surface) 55%)",
      }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm"
        style={{
          background: "color-mix(in oklab, var(--official) 18%, transparent)",
          border: "1px solid color-mix(in oklab, var(--official) 40%, transparent)",
        }}
      >
        <AlertTriangle className="h-4 w-4" style={{ color: "var(--official)" }} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <KindTag kind="official" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {alert.source}
          </span>
        </div>
        <p className="mt-1.5 text-sm font-semibold leading-snug">{alert.headline}</p>
        <p className="mt-1 text-xs text-muted-foreground">{alert.body}</p>
      </div>
      <div className="shrink-0 sm:text-right">
        <p className="label-meta">Valid until</p>
        <p className="font-mono text-xs">{formatDateTime(alert.validUntil)}</p>
        <ConfidenceMeter value={alert.confidence} className="mt-1.5 sm:justify-end" />
      </div>
    </div>
  );
}

export function AlertsFeed({
  alerts,
  limit,
  title = "Recent alerts",
}: {
  alerts?: HazardAlert[];
  limit?: number;
  title?: string;
}) {
  if (!alerts) {
    return (
      <Panel className="p-4">
        <SkeletonBlock className="h-56 w-full" />
      </Panel>
    );
  }
  const list = limit ? alerts.slice(0, limit) : alerts;

  return (
    <Panel>
      <PanelHeader
        title={title}
        sub={`${alerts.length} in force · official warnings and MausamMitra advisories`}
        right={<BellRing className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />}
      />
      <div className="space-y-2.5 p-4">
        {list.map((a) => (
          <AlertRow key={a.id} alert={a} dense={Boolean(limit)} />
        ))}
      </div>
    </Panel>
  );
}
