import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { bookmarksQuery } from "@/lib/intel";
import { RecordTable } from "@/components/intel/RecordTable";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — Lexsanction" }, { name: "description", content: "Your saved intelligence records." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(bookmarksQuery),
  component: Bookmarks,
});

function Bookmarks() {
  const { data } = useSuspenseQuery(bookmarksQuery);
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl">Bookmarks</h1>
      <p className="mb-4 text-sm text-muted-foreground">Records you have saved. Use the bookmark button on any record to add it here.</p>
      <RecordTable records={data.map((b) => b.record).filter(Boolean)} empty="You haven't saved any records yet." />
    </div>
  );
}
