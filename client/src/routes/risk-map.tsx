import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { RiskMap } from "@/components/map/RiskMap";
import { Panel, PanelHeader, RiskChip, hazardLabel, riskVar } from "@/components/common/primitives";
import { compactNumber, relativeTime } from "@/lib/format";

export const Route = createFileRoute("/risk-map")({
  head: () => ({
    meta: [
      { title: "Hyperlocal GIS Risk Map — MausamMitra" },
      {
        name: "description",
        content:
          "Toggle rainfall, flood, heat, storm, warning and emergency layers over India-focused risk zones with explainable contributing factors.",
      },
      { property: "og:title", content: "Hyperlocal GIS Risk Map — MausamMitra" },
      {
        property: "og:description",
        content:
          "Interactive hazard zones with risk level, why it was flagged, recommended action, source and validity.",
      },
    ],
  }),
  component: RiskMapPage,
});

function RiskMapPage() {
  const zones = useQuery({ queryKey: queryKeys.zones(), queryFn: mausamApi.getRiskZones });

  const exposed = (zones.data ?? []).reduce((sum, z) => sum + z.population, 0);
  const area = (zones.data ?? []).reduce((sum, z) => sum + z.areaKm2, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-wide">
          Hyperlocal GIS risk map
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {zones.data?.length ?? 0} modelled zones · {compactNumber(exposed)} people ·{" "}
          {compactNumber(area)} km² under active monitoring
        </p>
      </div>

      <RiskMap zones={zones.data} />

      <Panel>
        <PanelHeader title="Zone register" sub="Every polygon with its current classification" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-border">
                {["Zone", "Layer", "Level", "Population", "Area", "Updated"].map((h) => (
                  <th key={h} className="label-meta px-4 py-2 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(zones.data ?? []).map((z) => (
                <tr key={z.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: riskVar[z.level] }}
                        aria-hidden
                      />
                      <span className="text-xs font-medium">{z.name}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {z.district}, {z.state}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] uppercase text-muted-foreground">
                    {z.layer === "flood" || z.layer === "heat" || z.layer === "storm"
                      ? hazardLabel[z.layer]
                      : z.layer}
                  </td>
                  <td className="px-4 py-2.5">
                    <RiskChip level={z.level} />
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">
                    {compactNumber(z.population)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">{z.areaKm2} km²</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {relativeTime(z.provenance.issuedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
