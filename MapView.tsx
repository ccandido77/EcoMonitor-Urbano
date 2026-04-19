import AdminLayout from "@/components/AdminLayout";
import { MapView } from "@/components/Map";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../../shared/occurrences";
import { OCCURRENCE_CATEGORIES } from "../../../../drizzle/schema";
import type { OccurrenceCategory } from "../../../../drizzle/schema";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CategoryBadge, SeverityBadge, StatusBadge } from "@/components/OccurrenceBadges";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminMap() {
  const [categoryFilter, setCategoryFilter] = useState<OccurrenceCategory | "all">("all");
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const { data, isLoading, refetch } = trpc.occurrences.list.useQuery({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    limit: 200,
    offset: 0,
  });

  type OccurrenceItem = NonNullable<typeof data>["items"][0];
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceItem | null>(null);

  // ── Place markers on map ──────────────────────────────────────────────────

  const placeMarkers = useCallback(
    (map: google.maps.Map) => {
      // Clear existing markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      if (!data?.items.length) return;

      const bounds = new google.maps.LatLngBounds();

      data.items.forEach((occ) => {
        const color = CATEGORY_COLORS[occ.category as OccurrenceCategory] ?? "#6b7280";
        const position = { lat: occ.latitude, lng: occ.longitude };

        const marker = new google.maps.Marker({
          position,
          map,
          title: CATEGORY_LABELS[occ.category as OccurrenceCategory] ?? occ.category,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        marker.addListener("click", () => {
          setSelectedOccurrence(occ as any);
          map.panTo(position);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      });

      if (data.items.length > 0) {
        map.fitBounds(bounds, 60);
        if (data.items.length === 1) map.setZoom(15);
      }
    },
    [data]
  );

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      placeMarkers(map);
    },
    [placeMarkers]
  );

  // Re-place markers when data changes
  useEffect(() => {
    if (mapRef.current) placeMarkers(mapRef.current);
  }, [data, placeMarkers]);

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as OccurrenceCategory | "all")}
          >
            <SelectTrigger className="w-52 bg-white">
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {OCCURRENCE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-white"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Atualizar
          </Button>

          <span className="text-sm text-muted-foreground">
            {data?.total ?? 0} ocorrências no mapa
          </span>
        </div>

        {/* Map + detail panel */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Map */}
          <div className="relative flex-1 overflow-hidden rounded-xl border border-border shadow-sm">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <MapView
              onMapReady={handleMapReady}
              className="h-full w-full"
              initialCenter={{ lat: -15.7801, lng: -47.9292 }}
              initialZoom={5}
            />
          </div>

          {/* Legend + detail panel */}
          <div className="flex w-72 flex-col gap-3 overflow-y-auto">
            {/* Legend */}
            <Card className="border-border shadow-sm">
              <CardContent className="p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Legenda
                </p>
                <div className="space-y-2">
                  {OCCURRENCE_CATEGORIES.map((cat) => (
                    <div key={cat} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                      />
                      <span className="text-xs text-foreground">{CATEGORY_LABELS[cat]}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected occurrence detail */}
            {selectedOccurrence && (
              <Card className="border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ocorrência #{selectedOccurrence.id}
                    </p>
                    <button
                      onClick={() => setSelectedOccurrence(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>

                  {selectedOccurrence.imageUrl && (
                    <img
                      src={selectedOccurrence.imageUrl}
                      alt="Ocorrência"
                      className="mb-3 h-36 w-full rounded-lg object-cover"
                    />
                  )}

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    <CategoryBadge category={selectedOccurrence.category as OccurrenceCategory} />
                    <SeverityBadge severity={selectedOccurrence.severity as any} />
                    <StatusBadge status={selectedOccurrence.status as any} />
                  </div>

                  <p className="mb-3 text-sm text-foreground line-clamp-3">
                    {selectedOccurrence.description}
                  </p>

                  {selectedOccurrence.address && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      📍 {selectedOccurrence.address}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedOccurrence.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>

                  {selectedOccurrence.aiClassification && (
                    <div className="mt-3 rounded-lg bg-violet-50 p-3">
                      <p className="mb-1 text-xs font-medium text-violet-700">
                        ✨ Classificação IA ({Math.round((selectedOccurrence.aiClassification as any).confidence * 100)}% confiança)
                      </p>
                      <p className="text-xs text-violet-600 line-clamp-2">
                        {(selectedOccurrence.aiClassification as any).reasoning}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
