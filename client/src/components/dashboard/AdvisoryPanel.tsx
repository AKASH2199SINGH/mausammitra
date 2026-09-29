import { ClipboardCheck } from "lucide-react";
import {
  KindTag,
  Panel,
  PanelHeader,
  ProvenanceStrip,
  SkeletonBlock,
  hazardLabel,
  hazardVar,
} from "@/components/common/primitives";
import { modeLabels } from "@/context/AppStateContext";
import type { Advisory, AdvisoryItem } from "@/types/mausam";

const priorityVar: Record<AdvisoryItem["priority"], string> = {
  critical: "var(--risk-severe)",
  high: "var(--risk-high)",
  routine: "var(--risk-low)",
};

export function AdvisoryPanel({ advisory }: { advisory?: Advisory | undefined }) {
  if (!advisory) {
    return (
      <Panel className="p-4">
        <SkeletonBlock className="h-72 w-full" />
      </Panel>
    );
  }

  return (
    <Panel raised className="flex h-full flex-col">
      <PanelHeader
        title="What should I do?"
        sub={`${modeLabels[advisory.mode].label} mode · ${modeLabels[advisory.mode].hint}`}
        right={<ClipboardCheck className="h-4 w-4 text-accent" strokeWidth={1.7} />}
      />

      <div className="border-b border-border px-4 py-3">
        <KindTag kind="mausammitra" />
        <p className="mt-2 font-display text-lg leading-snug font-semibold">{advisory.headline}</p>
      </div>

      <ol className="flex-1 space-y-2.5 p-4">
        {advisory.items.map((item, i) => (
          <li
            key={item.id}
            className="panel-sunken px-3.5 py-3"
            style={{ borderLeft: `2px solid ${priorityVar[item.priority]}` }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{ color: priorityVar[item.priority] }}
              >
                {item.priority}
              </span>
              {item.hazard ? (
                <span
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: hazardVar[item.hazard] }}
                >
                  {hazardLabel[item.hazard]}
                </span>
              ) : null}
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                {item.window}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium leading-snug">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ol>

      <ProvenanceStrip provenance={advisory.provenance} />
    </Panel>
  );
}
