import type { OccurrenceCategory, OccurrenceStatus, SeverityLevel } from "./schema";

export const CATEGORY_LABELS: Record<OccurrenceCategory, string> = {
  air_pollution: "Poluição do Ar",
  water_pollution: "Poluição da Água",
  waste: "Resíduos",
  noise: "Poluição Sonora",
  deforestation: "Desmatamento",
  soil_contamination: "Contaminação do Solo",
  heat_island: "Ilha de Calor",
  flooding: "Alagamento",
  geoglyph_degradation: "Degradação de Geoglifos",
  other: "Outro",
};

export const CATEGORY_COLORS: Record<OccurrenceCategory, string> = {
  air_pollution: "#6366f1",
  water_pollution: "#0ea5e9",
  waste: "#f59e0b",
  noise: "#ec4899",
  deforestation: "#22c55e",
  soil_contamination: "#a16207",
  heat_island: "#ef4444",
  flooding: "#3b82f6",
  geoglyph_degradation: "#92400e",
  other: "#6b7280",
};

export const CATEGORY_ICONS: Record<OccurrenceCategory, string> = {
  air_pollution: "Wind",
  water_pollution: "Droplets",
  waste: "Trash2",
  noise: "Volume2",
  deforestation: "TreeDeciduous",
  soil_contamination: "FlaskConical",
  heat_island: "Thermometer",
  flooding: "Waves",
  geoglyph_degradation: "Landmark",
  other: "AlertCircle",
};

export const STATUS_LABELS: Record<OccurrenceStatus, string> = {
  pending: "Pendente",
  in_analysis: "Em Análise",
  resolved: "Resolvido",
  rejected: "Rejeitado",
};

export const STATUS_COLORS: Record<OccurrenceStatus, string> = {
  pending: "#f59e0b",
  in_analysis: "#3b82f6",
  resolved: "#22c55e",
  rejected: "#ef4444",
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};
