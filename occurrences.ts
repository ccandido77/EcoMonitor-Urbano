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
  // Ícone custom: octógono + círculo interno + 4 entradas cardinais
  // Representa as estruturas geométricas pré-colombianas do Acre (geoglifos)
  // Fonte: Instituto Geoglifos da Amazônia — geoglifosdaamazonia.org.br
  geoglyph_degradation: "GeoglyphAmazonia",
  other: "AlertCircle",
};

// SVG path data para o ícone do geoglifo amazônico (24×24 viewBox).
// Usado em mapas, badges e no formulário de registo.
export const GEOGLYPH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="9,2 15,2 22,9 22,15 15,22 9,22 2,15 2,9"/>
  <circle cx="12" cy="12" r="4"/>
  <line x1="12" y1="2"  x2="12" y2="8"/>
  <line x1="12" y1="16" x2="12" y2="22"/>
  <line x1="2"  y1="12" x2="8"  y2="12"/>
  <line x1="16" y1="12" x2="22" y2="12"/>
  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
</svg>`;

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
