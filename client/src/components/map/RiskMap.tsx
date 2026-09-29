import { useMemo, useState } from "react";
import { Layers, Crosshair, X } from "lucide-react";
import {
  ActionList,
  FactorBars,
  Panel,
  PanelHeader,
  ProvenanceStrip,
  RiskChip,
  SkeletonBlock,
  riskVar,
} from "@/components/common/primitives";
import { cn } from "@/lib/utils";
import { compactNumber } from "@/lib/format";
import type { RiskZone, ZoneLayer } from "@/types/mausam";

const layerMeta: Array<{ id: ZoneLayer; label: string; color: string }> = [
  { id: "rainfall", label: "Rainfall", color: "var(--rain)" },
  { id: "flood", label: "Flood risk", color: "var(--flood)" },
  { id: "heat", label: "Heat risk", color: "var(--heat)" },
  { id: "storm", label: "Storm risk", color: "var(--storm)" },
  { id: "warning", label: "Warning zones", color: "var(--official)" },
  { id: "emergency", label: "Emergency zones", color: "var(--accent)" },
];

const layerColor = (layer: ZoneLayer) =>
  layerMeta.find((l) => l.id === layer)?.color ?? "var(--primary)";

const points = (polygon: Array<[number, number]>) =>
  polygon.map(([x, y]) => `${x},${y}`).join(" ");

export function RiskMap({
  zones,
  className,
  height = "clamp(360px, 58vh, 620px)",
}: {
  zones?: RiskZone[] | undefined;
  className?: string | undefined;
  height?: string | undefined;
}) {
  const [active, setActive] = useState<Set<ZoneLayer>>(
    new Set<ZoneLayer>(["rainfall", "flood", "heat", "storm", "warning", "emergency"]),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(
    () => (zones ?? []).filter((z) => active.has(z.layer)),
    [zones, active],
  );
  const selected = visible.find((z) => z.id === selectedId) ?? null;

  const toggle = (layer: ZoneLayer) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });

  if (!zones) {
    return (
      <Panel className={cn("p-4", className)}>
        <SkeletonBlock className="h-[420px] w-full" />
      </Panel>
    );
  }

  return (
    <Panel raised className={cn("overflow-hidden", className)}>
      <PanelHeader
        title="Hyperlocal GIS risk map"
        sub="Gangetic plain · Vidarbha · Odisha coast — 1 km grid, model resolution 3 h"
        right={
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Layers className="h-3.5 w-3.5" /> {visible.length} zones
          </span>
        }
      />

      <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2.5">
        {layerMeta.map((l) => {
          const on = active.has(l.id);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => toggle(l.id)}
              aria-pressed={on}
              className={cn(
                "focus-ring flex items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-all",
                on ? "text-foreground" : "border-border text-muted-foreground hover:text-foreground",
              )}
              style={
                on
                  ? {
                      borderColor: `color-mix(in oklab, ${l.color} 45%, transparent)`,
                      background: `color-mix(in oklab, ${l.color} 12%, transparent)`,
                    }
                  : undefined
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: on ? l.color : "var(--muted-foreground)" }}
                aria-hidden
              />
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="relative lg:flex">
        <div
          className="panel-sunken relative m-3 flex-1 overflow-hidden rounded-md"
          style={{ height }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <pattern id="mm-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path
                  d="M5 0 L0 0 0 5"
                  fill="none"
                  stroke="var(--grid)"
                  strokeWidth="0.15"
                />
              </pattern>
              <pattern
                id="mm-rain"
                width="2.2"
                height="2.2"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="2.2"
                  stroke="color-mix(in oklab, var(--rain) 55%, transparent)"
                  strokeWidth="0.35"
                />
              </pattern>
              <radialGradient id="mm-terrain" cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor="oklch(0.3 0.04 200 / 0.55)" />
                <stop offset="60%" stopColor="oklch(0.22 0.03 240 / 0.4)" />
                <stop offset="100%" stopColor="oklch(0.16 0.02 250 / 0.6)" />
              </radialGradient>
            </defs>

            <rect width="100" height="100" fill="url(#mm-terrain)" />
            <rect width="100" height="100" fill="url(#mm-grid)" />

            {/* terrain / river contours */}
            <path
              d="M0 36 C 18 30, 34 42, 52 34 S 82 26, 100 32"
              fill="none"
              stroke="color-mix(in oklab, var(--flood) 55%, transparent)"
              strokeWidth="0.7"
            />
            <path
              d="M0 40 C 20 35, 36 47, 54 38 S 84 31, 100 37"
              fill="none"
              stroke="color-mix(in oklab, var(--flood) 25%, transparent)"
              strokeWidth="1.6"
            />
            <path
              d="M58 100 C 62 82, 74 72, 100 66"
              fill="none"
              stroke="color-mix(in oklab, var(--accent) 30%, transparent)"
              strokeWidth="0.5"
              strokeDasharray="1.5 1.2"
            />

            {visible.map((z) => {
              const color = layerColor(z.layer);
              const isSelected = selectedId === z.id;
              const isRain = z.layer === "rainfall";
              const isBoundary = z.layer === "warning";
              return (
                <g key={z.id} className="cursor-pointer">
                  <polygon
                    points={points(z.polygon)}
                    fill={
                      isRain
                        ? "url(#mm-rain)"
                        : isBoundary
                          ? "transparent"
                          : `color-mix(in oklab, ${color} ${isSelected ? 34 : 20}%, transparent)`
                    }
                    stroke={color}
                    strokeWidth={isSelected ? 0.7 : 0.4}
                    strokeDasharray={isBoundary ? "2 1.4" : undefined}
                    onClick={() => setSelectedId(z.id)}
                    style={{ transition: "fill 200ms ease" }}
                  />
                  {/* risk contour */}
                  {!isBoundary && !isRain ? (
                    <polygon
                      points={points(
                        z.polygon.map(([x, y]) => [
                          z.centroid[0] + (x - z.centroid[0]) * 0.6,
                          z.centroid[1] + (y - z.centroid[1]) * 0.6,
                        ]),
                      )}
                      fill="none"
                      stroke={color}
                      strokeWidth="0.25"
                      strokeDasharray="1 0.8"
                      pointerEvents="none"
                    />
                  ) : null}
                  <circle
                    cx={z.centroid[0]}
                    cy={z.centroid[1]}
                    r={isSelected ? 1.1 : 0.8}
                    fill={riskVar[z.level]}
                    onClick={() => setSelectedId(z.id)}
                  />
                </g>
              );
            })}
          </svg>

          {/* zone labels in DOM for crisp typography */}
          {visible.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => setSelectedId(z.id)}
              className={cn(
                "focus-ring absolute -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] backdrop-blur-sm transition-colors",
                selectedId === z.id
                  ? "border-input bg-secondary text-foreground"
                  : "border-border bg-background/70 text-muted-foreground hover:text-foreground",
              )}
              style={{ left: `${z.centroid[0]}%`, top: `${z.centroid[1]}%` }}
            >
              {z.name}
            </button>
          ))}

          <div className="pointer-events-none absolute bottom-2 left-2.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span className="h-[3px] w-10 border-x border-t border-muted-foreground/70" />
            50 km
          </div>
          <div className="pointer-events-none absolute right-2.5 top-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Crosshair className="h-3 w-3" /> 25.62°N 85.12°E
          </div>
        </div>

        <aside className="w-full shrink-0 border-t border-border p-3 lg:w-[360px] lg:border-l lg:border-t-0">
          {selected ? (
            <div className="panel-sunken flex h-full flex-col">
              <div className="flex items-start gap-2 border-b border-border px-3.5 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RiskChip level={selected.level} />
                    <span
                      className="font-mono text-[10px] uppercase tracking-widest"
                      style={{ color: layerColor(selected.layer) }}
                    >
                      {selected.layer}
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-lg leading-tight font-semibold">
                    {selected.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {selected.district}, {selected.state} · {selected.areaKm2} km² ·{" "}
                    {compactNumber(selected.population)} people
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close zone detail"
                  className="focus-ring ml-auto rounded-sm p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3">
                <div>
                  <p className="label-meta mb-1">Why this risk?</p>
                  <p className="text-xs leading-relaxed text-foreground/90">{selected.why}</p>
                </div>
                <div>
                  <p className="label-meta mb-2">Contributing factors</p>
                  <FactorBars factors={selected.factors} />
                </div>
                <div>
                  <p className="label-meta mb-2">Recommended action</p>
                  <ActionList actions={[selected.recommendedAction]} />
                </div>
              </div>

              <ProvenanceStrip provenance={selected.provenance} />
            </div>
          ) : (
            <div className="panel-sunken flex h-full flex-col justify-center gap-3 px-4 py-6 text-center">
              <p className="font-display text-base font-semibold">Select a zone</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tap any polygon or label to see its risk level, why it was flagged, contributing
                factors, recommended action, source and validity window.
              </p>
              <ul className="mt-2 space-y-1.5 text-left">
                {(zones ?? []).slice(0, 4).map((z) => (
                  <li key={z.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(z.id)}
                      className="focus-ring flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-secondary/40"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: riskVar[z.level] }}
                        aria-hidden
                      />
                      <span className="truncate text-xs">{z.name}</span>
                      <span className="ml-auto font-mono text-[10px] uppercase text-muted-foreground">
                        {z.layer}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </Panel>
  );
}
