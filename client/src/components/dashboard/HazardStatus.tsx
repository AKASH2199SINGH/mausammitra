import { useState } from "react";
import { ChevronDown, Droplets, Sun, Wind, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  ActionList,
  FactorBars,
  Panel,
  PanelHeader,
  ProvenanceStrip,
  RiskChip,
  SkeletonBlock,
  hazardLabel,
  riskLabel,
  riskVar,
} from "@/components/common/primitives";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/format";
import type { HazardRisk, HazardType, RiskSnapshot } from "@/types/mausam";

const hazardIcon: Record<HazardType, typeof Droplets> = {
  flood: Droplets,
  heat: Sun,
  storm: Wind,
};

const trendIcon = { rising: TrendingUp, steady: Minus, falling: TrendingDown };

function HazardCard({ risk }: { risk: HazardRisk }) {
  const [open, setOpen] = useState(false);
  const Icon = hazardIcon[risk.hazard];
  const Trend = trendIcon[risk.trend];

  return (
    <article className="panel-sunken overflow-hidden">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm"
          style={{
            background: `color-mix(in oklab, ${riskVar[risk.level]} 14%, transparent)`,
            border: `1px solid color-mix(in oklab, ${riskVar[risk.level]} 35%, transparent)`,
          }}
        >
          <Icon className="h-4 w-4" style={{ color: riskVar[risk.level] }} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold tracking-wide">
              {hazardLabel[risk.hazard]} risk
            </h3>
            <RiskChip level={risk.level} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{risk.summary}</p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className="font-display text-2xl leading-none font-semibold tabular-nums"
            style={{ color: riskVar[risk.level] }}
          >
            {risk.score}
          </p>
          <p className="mt-1 flex items-center justify-end gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Trend className="h-3 w-3" />
            {risk.trend}
          </p>
        </div>
      </div>

      <div className="px-3.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${risk.score}%`, background: riskVar[risk.level] }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring mt-2.5 flex w-full items-center justify-between px-3.5 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-accent transition-colors hover:text-foreground"
      >
        Why this risk?
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border px-3.5 py-3">
          <div>
            <p className="label-meta mb-2">Contributing factors</p>
            <FactorBars factors={risk.factors} />
          </div>
          <div>
            <p className="label-meta mb-2">Recommended action</p>
            <ActionList actions={risk.recommendedActions} />
          </div>
          <ProvenanceStrip provenance={risk.provenance} className="-mx-3.5 -mb-3 px-3.5" />
        </div>
      ) : null}
    </article>
  );
}

export function HazardStatus({ snapshot }: { snapshot?: RiskSnapshot | undefined }) {
  if (!snapshot) {
    return (
      <Panel className="p-4">
        <SkeletonBlock className="h-64 w-full" />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Hazard status"
        sub={snapshot.overallSummary}
        right={
          <div className="flex flex-col items-end gap-1">
            <RiskChip level={snapshot.overall} label={`Overall ${riskLabel[snapshot.overall]}`} />
            <span className="font-mono text-[10px] text-muted-foreground">
              recomputed {relativeTime(snapshot.updatedAt)}
            </span>
          </div>
        }
      />
      <div className="grid gap-3 p-4 xl:grid-cols-3">
        {snapshot.hazards.map((h) => (
          <HazardCard key={h.hazard} risk={h} />
        ))}
      </div>
    </Panel>
  );
}
