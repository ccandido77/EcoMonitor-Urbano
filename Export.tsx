import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CATEGORY_LABELS } from "../../../../shared/occurrences";
import { OCCURRENCE_CATEGORIES, OCCURRENCE_STATUSES } from "../../../../drizzle/schema";
import type { OccurrenceCategory, OccurrenceStatus } from "../../../../drizzle/schema";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminExport() {
  const [categoryFilter, setCategoryFilter] = useState<OccurrenceCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OccurrenceStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const exportCsvMutation = trpc.occurrences.exportCsv.useMutation();
  const exportPdfMutation = trpc.occurrences.exportPdfData.useMutation();

  const getFilters = () => ({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  // ── Export CSV ──────────────────────────────────────────────────────────────

  const handleExportCsv = async () => {
    setCsvLoading(true);
    try {
      const result = await exportCsvMutation.mutateAsync(getFilters());
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ecomonitor-ocorrencias-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`CSV exportado com ${result.total} ocorrências!`);
    } catch {
      toast.error("Erro ao exportar CSV.");
    } finally {
      setCsvLoading(false);
    }
  };

  // ── Export PDF ──────────────────────────────────────────────────────────────

  const handleExportPdf = async () => {
    setPdfLoading(true);
    try {
      const data = await exportPdfMutation.mutateAsync(getFilters());

      // Dynamic import to keep bundle size small
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // ── Header ──
      doc.setFillColor(45, 106, 79); // forest green
      doc.rect(0, 0, 297, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("EcoMonitor Urbano — Relatório de Ocorrências", 14, 13);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${data.generatedAt}`, 220, 13);

      // ── Stats summary ──
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Estatístico", 14, 30);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de ocorrências: ${data.stats.total}`, 14, 38);

      let xOffset = 14;
      data.stats.byStatus.forEach((s) => {
        const label = s.status === "pending" ? "Pendentes" :
          s.status === "in_analysis" ? "Em Análise" :
          s.status === "resolved" ? "Resolvidas" : "Rejeitadas";
        doc.text(`${label}: ${s.total}`, xOffset + 60, 38);
        xOffset += 50;
      });

      // ── Table ──
      autoTable(doc, {
        startY: 44,
        head: [["ID", "Categoria", "Descrição", "Gravidade", "Status", "Localização", "Reportado por", "Data"]],
        body: data.items.map((o) => [
          `#${o.id}`,
          o.category,
          o.description.length > 60 ? o.description.slice(0, 60) + "..." : o.description,
          o.severity,
          o.status,
          o.address || `${o.latitude}, ${o.longitude}`,
          o.userName,
          o.createdAt,
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [45, 106, 79],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 250, 247] },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 28 },
          2: { cellWidth: 60 },
          3: { cellWidth: 20 },
          4: { cellWidth: 22 },
          5: { cellWidth: 40 },
          6: { cellWidth: 30 },
          7: { cellWidth: 28 },
        },
      });

      // ── Footer ──
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, 270, 205);
      }

      doc.save(`ecomonitor-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`PDF exportado com ${data.items.length} ocorrências!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Exportar Relatórios</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure os filtros e exporte os dados em CSV ou PDF com estatísticas agregadas.
          </p>
        </div>

        {/* Filters */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Filtros de Exportação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v as OccurrenceCategory | "all")}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {OCCURRENCE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as OccurrenceStatus | "all")}
                >
                  <SelectTrigger className="mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_analysis">Em Análise</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start">Data inicial</Label>
                <Input
                  id="start"
                  type="date"
                  className="mt-1 bg-white"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end">Data final</Label>
                <Input
                  id="end"
                  type="date"
                  className="mt-1 bg-white"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export options */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* CSV */}
          <Card className="border-border shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Exportar CSV</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Planilha com todas as ocorrências filtradas. Compatível com Excel, Google Sheets e outros.
              </p>
              <Button
                className="w-full gap-2"
                onClick={handleExportCsv}
                disabled={csvLoading}
              >
                {csvLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Baixar CSV
              </Button>
            </CardContent>
          </Card>

          {/* PDF */}
          <Card className="border-border shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                <FileText className="h-6 w-6 text-sky-600" />
              </div>
              <h3 className="mb-1 font-semibold text-foreground">Exportar PDF</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Relatório formatado com cabeçalho, estatísticas resumidas e tabela de ocorrências.
              </p>
              <Button
                variant="outline"
                className="w-full gap-2 bg-white"
                onClick={handleExportPdf}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Baixar PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Nota:</strong> Os relatórios incluem apenas ocorrências
            que correspondam aos filtros selecionados. Sem filtros, todas as ocorrências serão exportadas.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
