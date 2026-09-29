import { modeLabels, useAppState } from "@/context/AppStateContext";
import { cn } from "@/lib/utils";
import type { UserMode } from "@/types/mausam";

const modes: UserMode[] = ["citizen", "farmer", "authority"];

export function ModeSelector({ className }: { className?: string }) {
  const { mode, setMode } = useAppState();

  return (
    <div
      className={cn("panel-sunken flex items-center p-1", className)}
      role="group"
      aria-label="User mode"
    >
      {modes.map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={active}
            title={modeLabels[m].hint}
            className={cn(
              "focus-ring rounded-sm px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-all",
              active
                ? "bg-secondary text-foreground shadow-panel"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {modeLabels[m].label}
          </button>
        );
      })}
    </div>
  );
}
