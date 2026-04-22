import type { OccurrenceCategory, OccurrenceStatus, SeverityLevel } from "./schema";

export const CATEGORY_LABELS: Record<OccurrenceCategory, string> = {
  air_pollution: "Poluição do Ar",
  water_pollution: "Poluição da Água",
  waste: "Resíduos",
  noise: "Poluição Sonora",
  deforestation: "Desmatamento",
  soil_contamination: "Contaminação do Solo",
  heat_island: "Queimadas",
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
// Baseado nas formas geométricas do logo do Instituto Geoglifos da Amazônia:
// cruz + quadrados terminais + rectângulo oco central.
export const GEOGLYPH_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter">
  <line x1="12" y1="6"  x2="12" y2="9"/>
  <line x1="12" y1="15" x2="12" y2="18"/>
  <line x1="6"  y1="12" x2="9"  y2="12"/>
  <line x1="15" y1="12" x2="18" y2="12"/>
  <rect x="9" y="9" width="6" height="6"/>
  <rect x="9.5" y="2"  width="5" height="4" fill="currentColor" stroke="none"/>
  <rect x="9.5" y="18" width="5" height="4" fill="currentColor" stroke="none"/>
  <rect x="2"   y="9.5" width="4" height="5" fill="currentColor" stroke="none"/>
  <rect x="18"  y="9.5" width="4" height="5" fill="currentColor" stroke="none"/>
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
