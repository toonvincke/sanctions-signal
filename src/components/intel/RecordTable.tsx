import { Link } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { TypeBadge } from "./badges";
import { formatDate, formatMoney, LEGAL_STATUS_LABELS, type ListRecord } from "@/lib/intel";

export function RecordTable({ records, empty = "No records match." }: { records: ListRecord[]; empty?: string }) {
  if (records.length === 0) return <div className="border bg-card p-10 text-center text-sm text-muted-foreground">{empty}</div>;
  return (
    <div className="overflow-x-auto border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/60 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 font-medium">Record</th>
            <th className="px-3 py-2 font-medium">Jur.</th>
            <th className="px-3 py-2 font-medium">Authority</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {records.map((r) => (
            <tr key={r.id} className="align-top hover:bg-muted/40">
              <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted-foreground">{formatDate(r.publication_date)}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <TypeBadge type={r.content_type} />
                  {r.priority && <Flag className="h-3 w-3 text-brand" aria-label="Priority" />}
                  {r.case_number && <span className="font-mono text-[11px] text-muted-foreground">{r.case_number}</span>}
                </div>
                <Link to="/records/$slug" params={{ slug: r.slug }} className="mt-1 block font-medium leading-snug hover:underline">
                  {r.headline}
                </Link>
              </td>
              <td className="px-3 py-3 font-mono text-xs">{r.jurisdiction?.code}</td>
              <td className="px-3 py-3 text-xs">{r.authority?.short_name}</td>
              <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">{LEGAL_STATUS_LABELS[r.legal_status]}</td>
              <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-xs">{formatMoney(r.penalty_amount, r.penalty_currency) ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
