import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "../../../shared/occurrences";
import type {
  OccurrenceCategory,
  OccurrenceStatus,
  SeverityLevel,
} from "../../../drizzle/schema";

// ─── Category Badge ───────────────────────────────────────────────────────────

const categoryVariantMap: Record<OccurrenceCategory, string> = {
  air_pollution: "bg-violet-100 text-violet-800 border-violet-200",
  water_pollution: "bg-sky-100 text-sky-800 border-sky-200",
  waste: "bg-amber-100 text-amber-800 border-amber-200",
  noise: "bg-pink-100 text-pink-800 border-pink-200",
  deforestation: "bg-green-100 text-green-800 border-green-200",
  soil_contamination: "bg-yellow-100 text-yellow-800 border-yellow-200",
  heat_island: "bg-red-100 text-red-800 border-red-200",
  flooding: "bg-blue-100 text-blue-800 border-blue-200",
  geoglyph_degradation: "bg-stone-100 text-stone-800 border-stone-300",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export function CategoryBadge({ category }: { category: OccurrenceCategory }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryVariantMap[category] ?? categoryVariantMap.other}`}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────

const severityVariantMap: Record<SeverityLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${severityVariantMap[severity] ?? severityVariantMap.medium}`}
    >
      {SEVERITY_LABELS[severity] ?? severity}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusVariantMap: Record<OccurrenceStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_analysis: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export function StatusBadge({ status }: { status: OccurrenceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusVariantMap[status] ?? statusVariantMap.pending}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
