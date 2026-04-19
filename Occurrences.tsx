import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "../../../../shared/occurrences";
import {
  OCCURRENCE_CATEGORIES,
  OCCURRENCE_STATUSES,
} from "../../../../drizzle/schema";
import type { OccurrenceCategory, OccurrenceStatus } from "../../../../drizzle/schema";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryBadge, SeverityBadge, StatusBadge } from "@/components/OccurrenceBadges";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PAGE_SIZE = 20;

export default function AdminOccurrences() {
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<OccurrenceCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OccurrenceStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.occurrences.list.useQuery({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const { data: detail } = trpc.occurrences.getById.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  const updateStatusMutation = trpc.occurrences.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      utils.occurrences.list.invalidate();
      utils.occurrences.getById.invalidate({ id: selectedId! });
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const resetFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Filters */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filtros</span>
              </div>

              <Select
                value={categoryFilter}
                onValueChange={(v) => { setCategoryFilter(v as OccurrenceCategory | "all"); setPage(0); }}
              >
                <SelectTrigger className="w-48 bg-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {OCCURRENCE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v) => { setStatusFilter(v as OccurrenceStatus | "all"); setPage(0); }}
              >
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {OCCURRENCE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="w-36 bg-white text-sm"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                  placeholder="De"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <Input
                  type="date"
                  className="w-36 bg-white text-sm"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                  placeholder="Até"
                />
              </div>

              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Limpar
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-2 bg-white"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !data?.items.length ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                <Search className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma ocorrência encontrada</p>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Gravidade</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Localização</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Data</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{item.id}</td>
                        <td className="px-4 py-3">
                          <CategoryBadge category={item.category as OccurrenceCategory} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <SeverityBadge severity={item.severity as any} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status as any} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="max-w-[160px] truncate">
                              {item.address || `${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} de{" "}
              {data?.total ?? 0} ocorrências
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ocorrência #{selectedId}</DialogTitle>
          </DialogHeader>

          {!detail ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {detail.imageUrl && (
                <img
                  src={detail.imageUrl}
                  alt="Ocorrência"
                  className="h-48 w-full rounded-lg object-cover"
                />
              )}

              <div className="flex flex-wrap gap-2">
                <CategoryBadge category={detail.category as OccurrenceCategory} />
                <SeverityBadge severity={detail.severity as any} />
                <StatusBadge status={detail.status as any} />
              </div>

              <p className="text-sm text-foreground">{detail.description}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground">Localização</p>
                  <p className="text-foreground">
                    {detail.address || `${detail.latitude.toFixed(5)}, ${detail.longitude.toFixed(5)}`}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Reportado em</p>
                  <p className="text-foreground">
                    {format(new Date(detail.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {(detail.userName || detail.reporterName) && (
                  <div>
                    <p className="font-medium text-muted-foreground">Reportado por</p>
                    <p className="text-foreground">{detail.userName ?? detail.reporterName}</p>
                  </div>
                )}
              </div>

              {detail.aiClassification && (
                <div className="rounded-lg bg-violet-50 p-3 text-xs">
                  <p className="mb-1 font-medium text-violet-700">
                    ✨ Classificação IA ({Math.round((detail.aiClassification as any).confidence * 100)}% confiança)
                  </p>
                  <p className="text-violet-600">{(detail.aiClassification as any).reasoning}</p>
                </div>
              )}

              {/* Status update */}
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium text-foreground">Atualizar Status</p>
                <div className="flex flex-wrap gap-2">
                  {OCCURRENCE_STATUSES.map((s) => (
                    <Button
                      key={s}
                      variant={detail.status === s ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      disabled={updateStatusMutation.isPending}
                      onClick={() =>
                        updateStatusMutation.mutate({ id: detail.id, status: s })
                      }
                    >
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
