import { ShieldAlert, Siren, Users } from "lucide-react";
import {
  Metric,
  Panel,
  PanelHeader,
  RiskChip,
  SkeletonBlock,
  hazardLabel,
  hazardVar,
  riskVar,
} from "@/components/common/primitives";
import { compactNumber } from "@/lib/format";
import type { AuthorityMetrics } from "@/types/mausam";

export function AuthorityConsole({ metrics }: { metrics?: AuthorityMetrics }) {
  if (!metrics) {
    return (
      <Panel className="p-4">
        <SkeletonBlock className="h-80 w-full" />
      </Panel>
    );
  }

  const maxTrend = 100;

  return (
    <div className="space-y-4">
      <Panel raised>
        <PanelHeader
          title="Operational overview"
          sub="Multi-district hazard picture · state emergency operations centre view"
          right={
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <Siren className="h-3.5 w-3.5" style={{ color: "var(--official)" }} />
              {metrics.responseTeamsDeployed} teams deployed
            </span>
          }
        />
        <div className="grid gap-2 p-4 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Active warnings" value={metrics.activeWarnings} accent="var(--official)" />
          <Metric label="High-risk zones" value={metrics.highRiskZones} accent="var(--risk-high)" />
          <Metric label="Critical zones" value={metrics.criticalZones} accent="var(--risk-severe)" />
          <Metric
            label="Affected people"
            value={compactNumber(metrics.affectedPopulation)}
            sub="estimated exposure"
          />
          <Metric
            label="Affected area"
            value={compactNumber(metrics.affectedAreaKm2)}
            unit="km²"
          />
          <Metric label="Teams" value={metrics.responseTeamsDeployed} sub="NDRF / SDRF / ODRAF" />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Panel>
          <PanelHeader title="Hazard trend" sub="Composite risk index, 06:00 → 18:00 IST" />
          <div className="p-4">
            <div className="flex items-end gap-3 overflow-x-auto">
              {metrics.hazardTrend.map((t) => (
                <div key={t.time} className="w-16 shrink-0">
                  <div className="panel-sunken flex h-40 items-end gap-1 px-1.5 pb-1.5 pt-1.5">
                    {(["flood", "heat", "storm"] as const).map((h) => (
                      <div
                        key={h}
                        className="flex-1 rounded-t-sm transition-[height] duration-700"
                        style={{
                          height: `${(t[h] / maxTrend) * 100}%`,
                          background: `color-mix(in oklab, ${hazardVar[h]} 70%, transparent)`,
                          borderTop: `1px solid ${hazardVar[h]}`,
                        }}
                        title={`${hazardLabel[h]} ${t[h]}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-center font-mono text-[10px] text-muted-foreground">
                    {t.time}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-4">
              {(["flood", "heat", "storm"] as const).map((h) => (
                <span
                  key={h}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  <span
                    className="h-1.5 w-3 rounded-full"
                    style={{ background: hazardVar[h] }}
                    aria-hidden
                  />
                  {hazardLabel[h]}
                </span>
              ))}
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Priority locations"
            sub="Sequenced by exposure and escalation speed"
            right={<ShieldAlert className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />}
          />
          <ol className="space-y-2.5 p-4">
            {metrics.priorityLocations.map((loc, i) => (
              <li
                key={loc.id}
                className="panel-sunken px-3.5 py-3"
                style={{ borderLeft: `2px solid ${riskVar[loc.level]}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    P{i + 1}
                  </span>
                  <RiskChip level={loc.level} />
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: hazardVar[loc.hazard] }}
                  >
                    {hazardLabel[loc.hazard]}
                  </span>
                  <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {compactNumber(loc.population)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium">{loc.name}</p>
                <p className="text-[11px] text-muted-foreground">{loc.district} district</p>
                <p className="mt-1.5 text-xs text-foreground/90">Action: {loc.action}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
