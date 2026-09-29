import { X } from "lucide-react";
import { HealthDot, Panel, PanelHeader } from "@/components/common/primitives";
import { formatDateTime } from "@/lib/format";
import type { SystemStatus } from "@/types/mausam";

export function SystemStatusPanel({
  status,
  onClose,
}: {
  status: SystemStatus;
  onClose: () => void;
}) {
  return (
    <Panel raised>
      <PanelHeader
        title="System & data connection"
        sub={`Last sync ${formatDateTime(status.lastSync)} · round-trip ${status.latencyMs} ms · offline cache ${status.offlineCacheReady ? "ready" : "stale"}`}
        right={
          <button
            type="button"
            onClick={onClose}
            aria-label="Close system status"
            className="focus-ring rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        }
      />
      <ul className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {status.services.map((s) => (
          <li key={s.name} className="panel-sunken flex items-start gap-2.5 px-3 py-2.5">
            <span className="mt-1.5">
              <HealthDot health={s.health} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium">{s.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{s.detail}</span>
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {s.health}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
