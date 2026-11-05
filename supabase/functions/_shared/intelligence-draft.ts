export const contentTypes = ["sanctions_development", "case_law", "enforcement_action", "guidance", "legislation", "circumvention"] as const;
export const legalStatuses = ["final_judgment", "interim", "ag_opinion", "settlement", "penalty_notice", "conviction", "allegation", "in_force", "announced", "not_applicable"] as const;

export function validateIntelligenceDraft(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("AI draft is not an object");
  const draft = value as Record<string, unknown>;
  const requiredStrings = ["headline", "executive_summary", "source_facts", "practical_implications", "detailed_analysis"];
  const requiredArrays = ["affected_entities", "affected_sectors", "legal_provisions", "tags"];
  if (!contentTypes.includes(draft.content_type as typeof contentTypes[number]) ||
      !legalStatuses.includes(draft.legal_status as typeof legalStatuses[number]) ||
      requiredStrings.some((key) => typeof draft[key] !== "string" || !(draft[key] as string).trim()) ||
      requiredArrays.some((key) => !Array.isArray(draft[key]) || !(draft[key] as unknown[]).every((item) => typeof item === "string")) ||
      typeof draft.priority !== "boolean") {
    throw new Error("AI draft failed schema validation");
  }
  return draft;
}
