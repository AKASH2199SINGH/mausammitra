import { CloudRain, Droplets, Gauge, Eye, Thermometer, Wind } from "lucide-react";
import { Metric, Panel, PanelHeader, ProvenanceStrip, SkeletonBlock } from "@/components/common/primitives";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { CurrentWeather } from "@/types/mausam";

export function WeatherOverview({ data }: { data?: CurrentWeather | undefined }) {
  if (!data) {
    return (
      <Panel className="p-4">
        <SkeletonBlock className="h-40 w-full" />
      </Panel>
    );
  }

  return (
    <Panel raised>
      <PanelHeader
        title="Current conditions"
        sub={`${data.location.name} · ${data.location.district}, ${data.location.state} · ${data.location.coords.lat.toFixed(3)}°N ${data.location.coords.lon.toFixed(3)}°E`}
        right={
          <span className="font-mono text-[11px] text-muted-foreground">
            Updated {relativeTime(data.observedAt)}
          </span>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="font-display text-6xl leading-none font-semibold tabular-nums">
              {data.temperatureC.toFixed(1)}
            </span>
            <span className="absolute -right-4 top-1 text-lg text-muted-foreground">°C</span>
          </div>
          <div className="min-w-0 pl-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CloudRain className="h-4 w-4 text-rain" strokeWidth={1.8} />
              {data.condition}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Feels like {data.feelsLikeC.toFixed(1)} °C · observed {formatDateTime(data.observedAt)}
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Rain now" value={data.rainfallMm} unit="mm/hr" accent="var(--rain)" />
          <Metric label="Rain 24 h" value={data.rainfall24hMm} unit="mm" accent="var(--flood)" />
          <Metric label="Wind" value={data.windKph} unit={`kmph ${data.windDirection}`} />
          <Metric label="Humidity" value={data.humidityPct} unit="%" />
          <Metric label="Pressure" value={data.pressureHpa} unit="hPa" />
          <Metric label="Visibility" value={data.visibilityKm} unit="km" />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 px-4 pb-3">
        {[
          { icon: Thermometer, text: `Heat index ${data.feelsLikeC.toFixed(1)} °C` },
          { icon: Droplets, text: `Dew point high, saturation ${data.humidityPct}%` },
          { icon: Wind, text: `Gust potential ${Math.round(data.windKph * 1.6)} kmph` },
          { icon: Gauge, text: `Pressure tendency ${data.pressureHpa < 1000 ? "falling" : "steady"}` },
          { icon: Eye, text: `Visibility ${data.visibilityKm} km` },
        ].map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.6} />
            {text}
          </span>
        ))}
      </div>

      <ProvenanceStrip provenance={data.provenance} />
    </Panel>
  );
}
