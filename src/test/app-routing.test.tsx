import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId, Outlet } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { RegimeLayout } from "@/routes/sanctions.$regime";
import { PROGRAMME_DETAILS } from "@/lib/programme-detail";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("renders an Outlet in the regime parent so nested programme pages are visible", () => {
    expect(RegimeLayout().type).toBe(Outlet);
  });

  it("matches the jurisdiction overview at its index route", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/sanctions/un").at(-1)?.routeId).toBe("/sanctions/$regime/");
  });
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("resolves every current EU, US, UK and UN programme detail URL", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const programme of PROGRAMME_DETAILS) {
      const path = `/sanctions/${programme.jurisdiction}/${programme.slug}`;
      const matches = router.matchRoutes(path);
      expect(matches.at(-1)?.routeId, `Missing route for ${path}`).toBe("/sanctions/$regime/$program");
    }
  });
});
