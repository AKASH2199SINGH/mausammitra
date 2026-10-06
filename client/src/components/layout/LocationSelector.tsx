import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { mausamApi, queryKeys } from "@/services/mausamApi";
import { useAppState } from "@/context/AppStateContext";
import { defaultLocationId } from "@/services/mockData";

export function LocationSelector() {
  const { locationId, setLocationId } = useAppState();
  const { data: locations } = useQuery({
    queryKey: queryKeys.locations(),
    queryFn: mausamApi.listLocations,
  });

  // The backend owns the location catalogue. If the stored id is missing from it
  // (renamed/removed location, or a stale local default), fall back so the
  // <select> never renders blank and queries never target an unknown id. The
  // catalogue default wins over `locations[0]`: the list is sorted by state, so
  // the first entry is just whichever state happens to sort first.
  useEffect(() => {
    if (!locations?.length) return;
    const known = (id: string) => locations.some((l) => l.id === id);
    if (known(locationId)) return;
    setLocationId(known(defaultLocationId) ? defaultLocationId : locations[0]!.id);
  }, [locations, locationId, setLocationId]);

  return (
    <label className="panel-sunken flex items-center gap-2 px-2.5 py-1.5">
      <MapPin className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
      <span className="sr-only">Current location</span>
      <select
        value={locationId}
        disabled={!locations?.length}
        onChange={(e) => setLocationId(e.target.value)}
        className="focus-ring max-w-[9.5rem] cursor-pointer appearance-none bg-transparent text-xs font-medium text-foreground outline-none sm:max-w-none"
      >
        {locations?.length ? (
          locations.map((l) => (
            <option key={l.id} value={l.id} className="bg-popover text-popover-foreground">
              {l.name}, {l.state}
            </option>
          ))
        ) : (
          <option className="bg-popover text-popover-foreground">Loading…</option>
        )}
      </select>
    </label>
  );
}
