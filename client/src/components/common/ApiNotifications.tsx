import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const TOAST_ID = "api-error";

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Makes backend failures visible.
 *
 * Query panels render a loading skeleton whenever `data` is undefined, so without
 * feedback an unreachable API looks like a page that simply never finishes loading.
 * Failures collapse into a single toast (keyed by a fixed id) and it clears once the
 * health probe succeeds again.
 */
export function ApiNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cache = queryClient.getQueryCache();

    const unsubscribe = cache.subscribe((event) => {
      if (event.type !== "updated") return;

      const { query } = event;
      const isHealthProbe = query.queryKey[0] === "system" && query.queryKey[1] === "status";

      if (query.state.status === "success" && isHealthProbe) {
        toast.dismiss(TOAST_ID);
        return;
      }

      // errorUpdateCount is 1 only on the first failure of a query instance, so
      // refetch loops don't spam the same message.
      if (query.state.status === "error" && query.state.errorUpdateCount === 1) {
        toast.error("Couldn't load live data", {
          id: TOAST_ID,
          description: describe(query.state.error),
          duration: 8000,
        });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return <Toaster position="top-right" richColors closeButton />;
}
