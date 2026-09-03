import {
  Panel,
  PanelHeader,
  ProvenanceStrip,
  SkeletonBlock,
  hazardLabel,
  riskVar,
} from "@/components/common/primitives";
import type { WeatherForecast } from "@/types/mausam";

export function ForecastTimeline({ forecast }: { forecast?: WeatherForecast }) {
  if (!forecast) {
    return (
      <Panel className="p-4">
        <SkeletonBlock className="h-48 w-full" />
      </Panel>
    );
  }

  const maxRain = Math.max(...forecast.slots.map((s) => s.rainfallMm), 10);

  return (
    <Panel>
      <PanelHeader
        title="Forecast timeline"
        sub="Next 24 hours · 3-hourly, hyperlocal downscale"
        right={
          <div className="flex items-center gap-3">
            {(["flood", "heat", "storm"] as const).map((h) => (
              <span
                key={h}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                <span
                  className="h-1.5 w-3 rounded-full"
                  style={{ background: `var(--${h})` }}
                  aria-hidden
                />
                {hazardLabel[h]}
              </span>
            ))}
          </div>
        }
      />

      <div className="overflow-x-auto px-4 py-4">
        <div className="flex min-w-max items-end gap-2">
          {forecast.slots.map((slot) => (
            <div key={slot.time} className="w-[86px] shrink-0">
              <div className="panel-sunken flex h-[168px] flex-col justify-end gap-2 px-2 pb-2 pt-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg leading-none font-semibold tabular-nums">
                    {Math.round(slot.temperatureC)}°
                  </span>
                  <span className="font-mono text-[10px] text-rain">{slot.rainChancePct}%</span>
                </div>
                <p className="min-h-[26px] text-[10px] leading-snug text-muted-foreground">
                  {slot.condition}
                </p>
                <div className="relative flex h-16 items-end gap-1">
                  <div
                    className="w-full rounded-t-sm transition-[height] duration-700"
                    style={{
                      height: `${Math.max(6, (slot.rainfallMm / maxRain) * 100)}%`,
                      background: "color-mix(in oklab, var(--rain) 65%, transparent)",
                      borderTop: "1px solid var(--rain)",
                    }}
                    title={`${slot.rainfallMm} mm`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {slot.rainfallMm} mm
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {slot.windKph}k
                  </span>
                </div>
              </div>
              <div
                className="mt-1.5 h-1 rounded-full"
                style={{
                  background: slot.dominantRisk
                    ? `var(--${slot.dominantRisk})`
                    : `color-mix(in oklab, ${riskVar[slot.riskLevel]} 55%, transparent)`,
                }}
                title={`${slot.riskLevel} risk`}
              />
              <p className="mt-1.5 text-center font-mono text-[11px] tracking-wide text-foreground/85">
                {slot.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ProvenanceStrip provenance={forecast.provenance} />
    </Panel>
  );
}
