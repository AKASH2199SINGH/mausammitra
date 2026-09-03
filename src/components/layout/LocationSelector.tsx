import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";

export function LocationSelector() {
  const { locationId, setLocationId } = useAppState();
  const { data: locations } = useQuery({
    queryKey: queryKeys.locations(),
    queryFn: mausamApi.listLocations,
  });

  return (
    <label className="panel-sunken flex items-center gap-2 px-2.5 py-1.5">
      <MapPin className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
      <span className="sr-only">Current location</span>
      <select
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="focus-ring max-w-[9.5rem] cursor-pointer appearance-none bg-transparent text-xs font-medium text-foreground outline-none sm:max-w-none"
      >
        {(locations ?? []).map((l) => (
          <option key={l.id} value={l.id} className="bg-popover text-popover-foreground">
            {l.name}, {l.state}
          </option>
        ))}
      </select>
    </label>
  );
}
