import { createFileRoute, notFound, Outlet, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";
import { REGIMES, type RegimeSlug } from "@/lib/sanctions-programs";

export const Route = createFileRoute("/sanctions/$regime")({
  loader: ({ params }) => {
    const regime = REGIMES[params.regime as RegimeSlug];
    if (!regime) throw notFound();
    return { slug: regime.slug };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-3xl">Programme overview not found</h1>
        <Link to="/" className="mt-4 inline-block text-brand underline">Back to home</Link>
      </main>
    </SiteLayout>
  ),
  component: RegimeLayout,
});

/** The parent must render its outlet so both overview and programme child routes mount. */
export function RegimeLayout() {
  return <Outlet />;
}
