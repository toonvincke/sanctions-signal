import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_TYPE_LABELS, VERIFICATION_LABELS, type ContentType, type Verification } from "@/lib/intel";

const typeTone: Record<ContentType, string> = {
  sanctions_development: "border-primary/30 text-primary",
  case_law: "border-chart-5/40 text-foreground",
  enforcement_action: "border-brand/40 text-brand",
  guidance: "border-success/40 text-success",
  legislation: "border-success/40 text-success",
  circumvention: "border-warning/50 text-warning",
};

export function TypeBadge({ type, className }: { type: ContentType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        typeTone[type],
        className,
      )}
    >
      {CONTENT_TYPE_LABELS[type]}
    </span>
  );
}

export function VerificationBadge({ status }: { status: Verification }) {
  const Icon = status === "verified" ? CheckCircle2 : status === "pending_review" ? Clock : AlertTriangle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        status === "verified" ? "text-success" : status === "pending_review" ? "text-warning" : "text-destructive",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {VERIFICATION_LABELS[status]}
    </span>
  );
}
