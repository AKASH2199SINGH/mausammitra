import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { WeatherOverview } from "@/components/dashboard/WeatherOverview";
import { HazardStatus } from "@/components/dashboard/HazardStatus";
import { ForecastTimeline } from "@/components/dashboard/ForecastTimeline";
import { AlertsFeed, OfficialWarningBanner } from "@/components/dashboard/AlertsFeed";
import { AdvisoryPanel } from "@/components/dashboard/AdvisoryPanel";
import { RiskMap } from "@/components/map/RiskMap";
import { AuthorityConsole } from "@/components/authority/AuthorityConsole";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MausamMitra — Voice & AI Hazard Advisory Command Center" },
      {
        name: "description",
        content:
          "Hyperlocal flood, heat and storm risk intelligence for India with grounded AI advisories, GIS risk zones and Hindi/English voice interaction.",
      },
      { property: "og:title", content: "MausamMitra — Hazard Advisory Command Center" },
      {
        property: "og:description",
        content:
          "Live IMD and CWC feeds fused into explainable flood, heat and storm risk with citizen, farmer and authority advisories.",
      },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const { locationId, mode } = useAppState();

  const weather = useQuery({
    queryKey: queryKeys.weather(locationId),
    queryFn: () => mausamApi.getCurrentWeather(locationId),
  });
  const risk = useQuery({
    queryKey: queryKeys.risk(locationId),
    queryFn: () => mausamApi.getRisk(locationId),
  });
  const forecast = useQuery({
    queryKey: queryKeys.forecast(locationId),
    queryFn: () => mausamApi.getForecast(locationId),
  });
  const alerts = useQuery({
    queryKey: queryKeys.alerts(locationId),
    queryFn: () => mausamApi.getAlerts(locationId),
  });
  const advisory = useQuery({
    queryKey: queryKeys.advisory(mode, locationId),
    queryFn: () => mausamApi.getAdvisory(mode, locationId),
  });
  const zones = useQuery({ queryKey: queryKeys.zones(), queryFn: mausamApi.getRiskZones });
  const authority = useQuery({
    queryKey: queryKeys.authority(),
    queryFn: mausamApi.getAuthorityMetrics,
    enabled: mode === "authority",
  });

  const officialWarning = alerts.data?.find((a) => a.kind === "official");

  return (
    <div className="space-y-4">
      <h1 className="sr-only">MausamMitra hazard advisory command center</h1>

      <OfficialWarningBanner alert={officialWarning} />

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-4">
          <WeatherOverview data={weather.data} />
          <HazardStatus snapshot={risk.data} />
          <ForecastTimeline forecast={forecast.data} />
        </div>
        <div className="space-y-4">
          <AdvisoryPanel advisory={advisory.data} />
          <AlertsFeed alerts={alerts.data} limit={3} />
        </div>
      </div>

      {mode === "authority" ? <AuthorityConsole metrics={authority.data} /> : null}

      <RiskMap zones={zones.data} height="clamp(320px, 46vh, 480px)" />

      <div className="flex flex-wrap gap-2">
        {[
          { to: "/risk-map", label: "Open full risk map" },
          { to: "/assistant", label: "Ask the assistant" },
          { to: "/alerts", label: "Alert center" },
          { to: "/authority", label: "Authority operations" },
        ].map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="focus-ring panel-sunken flex items-center gap-2 px-3 py-2 text-xs text-foreground/90 transition-colors hover:bg-secondary/40"
          >
            {l.label}
            <ArrowRight className="h-3.5 w-3.5 text-accent" />
          </Link>
        ))}
      </div>
    </div>
  );
}
