import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { AuthorityConsole } from "@/components/authority/AuthorityConsole";
import { AdvisoryPanel } from "@/components/dashboard/AdvisoryPanel";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { RiskMap } from "@/components/map/RiskMap";

export const Route = createFileRoute("/authority")({
  head: () => ({
    meta: [
      { title: "Authority Command Center — MausamMitra" },
      {
        name: "description",
        content:
          "Operational view for district and state control rooms: active warnings, critical zones, exposure estimates, hazard trends and priority actions.",
      },
      { property: "og:title", content: "Authority Command Center — MausamMitra" },
      {
        property: "og:description",
        content:
          "Multi-district hazard picture with sequenced priority locations and recommended operational actions.",
      },
    ],
  }),
  component: AuthorityPage,
});

function AuthorityPage() {
  const { locationId } = useAppState();
  const metrics = useQuery({
    queryKey: queryKeys.authority(),
    queryFn: mausamApi.getAuthorityMetrics,
  });
  const advisory = useQuery({
    queryKey: queryKeys.advisory("authority", locationId),
    queryFn: () => mausamApi.getAdvisory("authority", locationId),
  });
  const alerts = useQuery({
    queryKey: queryKeys.alerts(locationId),
    queryFn: () => mausamApi.getAlerts(locationId),
  });
  const zones = useQuery({ queryKey: queryKeys.zones(), queryFn: mausamApi.getRiskZones });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-wide">
          Authority command center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational picture for district and state emergency operations centres.
        </p>
      </div>

      <AuthorityConsole metrics={metrics.data} />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AdvisoryPanel advisory={advisory.data} />
        <AlertsFeed alerts={alerts.data} title="Warnings in force" />
      </div>

      <RiskMap zones={zones.data} height="clamp(320px, 46vh, 500px)" />
    </div>
  );
}
