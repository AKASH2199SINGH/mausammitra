import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { AlertRow, OfficialWarningBanner } from "@/components/dashboard/AlertsFeed";
import { Metric, Panel, PanelHeader, SkeletonBlock } from "@/components/common/primitives";
import { cn } from "@/lib/utils";
import type { AlertKind } from "@/types/mausam";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alert & Notification Center — MausamMitra" },
      {
        name: "description",
        content:
          "Active official warnings and MausamMitra advisories with severity, affected areas, validity windows and confidence.",
      },
      { property: "og:title", content: "Alert & Notification Center — MausamMitra" },
      {
        property: "og:description",
        content:
          "Every flood, heat and storm alert in force, clearly separated into official warnings and model advisories.",
      },
    ],
  }),
  component: AlertsPage,
});

const filters: Array<{ id: "all" | AlertKind; label: string }> = [
  { id: "all", label: "All" },
  { id: "official", label: "Official warnings" },
  { id: "mausammitra", label: "MausamMitra advisories" },
];

function AlertsPage() {
  const { locationId } = useAppState();
  const [filter, setFilter] = useState<"all" | AlertKind>("all");
  const alerts = useQuery({
    queryKey: queryKeys.alerts(locationId),
    queryFn: () => mausamApi.getAlerts(locationId),
  });

  const list = (alerts.data ?? []).filter((a) => filter === "all" || a.kind === filter);
  const official = alerts.data?.find((a) => a.kind === "official");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-wide">
          Alert &amp; notification center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Official warnings are reproduced verbatim from the issuing agency. MausamMitra advisories
          are model-generated interpretations and always labelled as such.
        </p>
      </div>

      <OfficialWarningBanner alert={official} />

      <div className="grid gap-2 sm:grid-cols-4">
        <Metric
          label="Total in force"
          value={alerts.data?.length ?? 0}
          sub="across monitored districts"
        />
        <Metric
          label="Official warnings"
          value={alerts.data?.filter((a) => a.kind === "official").length ?? 0}
          accent="var(--official)"
        />
        <Metric
          label="Model advisories"
          value={alerts.data?.filter((a) => a.kind === "mausammitra").length ?? 0}
          accent="var(--advisory)"
        />
        <Metric
          label="Emergency / warning"
          value={
            alerts.data?.filter((a) => a.severity === "warning" || a.severity === "emergency")
              .length ?? 0
          }
          accent="var(--risk-high)"
        />
      </div>

      <Panel>
        <PanelHeader
          title="Alert feed"
          sub="Newest first · severity-coded"
          right={
            <div className="flex flex-wrap gap-1.5">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  aria-pressed={filter === f.id}
                  className={cn(
                    "focus-ring rounded-sm border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                    filter === f.id
                      ? "border-input bg-secondary text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        />
        <div className="space-y-2.5 p-4">
          {alerts.isLoading ? <SkeletonBlock className="h-56 w-full" /> : null}
          {list.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
