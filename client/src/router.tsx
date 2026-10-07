import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // One retry keeps a transient blip from flashing an error toast; beyond that
        // fail fast so the UI can show feedback instead of spinning indefinitely.
        retry: 1,
        retryDelay: 800,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // A dropped connection can otherwise hang a request with no upper bound.
        throwOnError: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
