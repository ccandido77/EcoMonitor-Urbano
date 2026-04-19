import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Leaf,
  Loader2,
  MapPin,
  Navigation,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { CATEGORY_LABELS, SEVERITY_LABELS } from "../../../shared/occurrences";
import { OCCURRENCE_CATEGORIES, SEVERITY_LEVELS } from "../../../drizzle/schema";
import type { OccurrenceCategory, SeverityLevel } from "../../../drizzle/schema";

interface AISuggestion {
  suggestedCategory: OccurrenceCategory;
  suggestedSeverity: SeverityLevel;
  confidence: number;
  reasoning: string;
}

export default function NewReport() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Form state
  const [category, setCategory] = useState<OccurrenceCategory | "">("");
  const [severity, setSeverity] = useState<SeverityLevel>("medium");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [reporterName, setReporterName] = useState(user?.name ?? "");
  const [reporterEmail, setReporterEmail] = useState(user?.email ?? "");

  // Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI state
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Submit state
  const [submitted, setSubmitted] = useState(false);

  const uploadImageMutation = trpc.occurrences.uploadImage.useMutation();
  const classifyMutation = trpc.occurrences.classify.useMutation();
  const createMutation = trpc.occurrences.create.useMutation();

  // ── GPS ──────────────────────────────────────────────────────────────────

  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocalização não suportada neste navegador.");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsLoading(false);
        toast.success("Localização capturada com sucesso!");
      },
      (err) => {
        setGpsError("Não foi possível obter a localização. Insira manualmente.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleImageChange = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo 5MB.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to S3 if authenticated
      if (user) {
        setUploadLoading(true);
        try {
          const base64 = await fileToBase64(file);
          const result = await uploadImageMutation.mutateAsync({
            base64,
            mimeType: file.type,
            fileName: file.name,
          });
          setImageUrl(result.url);
          setImageKey(result.key);
          toast.success("Imagem enviada com sucesso!");
        } catch {
          toast.error("Erro ao enviar imagem. Tente novamente.");
        } finally {
          setUploadLoading(false);
        }
      }
    },
    [user, uploadImageMutation]
  );

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    setImageKey(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── AI Classification ─────────────────────────────────────────────────────

  const runAIClassification = useCallback(async () => {
    if (!description || description.length < 10) {
      toast.error("Descreva a ocorrência com pelo menos 10 caracteres para usar a IA.");
      return;
    }
    setAiLoading(true);
    try {
      const result = await classifyMutation.mutateAsync({
        description,
        imageUrl: imageUrl ?? undefined,
      });
      setAiSuggestion(result);
      toast.success("Classificação por IA concluída!");
    } catch {
      toast.error("Erro na classificação por IA.");
    } finally {
      setAiLoading(false);
    }
  }, [description, imageUrl, classifyMutation]);

  const applyAISuggestion = useCallback(() => {
    if (!aiSuggestion) return;
    setCategory(aiSuggestion.suggestedCategory);
    setSeverity(aiSuggestion.suggestedSeverity);
    toast.success("Sugestão da IA aplicada!");
  }, [aiSuggestion]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!category) { toast.error("Selecione uma categoria."); return; }
      if (!latitude || !longitude) { toast.error("Informe a localização."); return; }
      if (description.length < 10) { toast.error("Descrição muito curta."); return; }

      try {
        await createMutation.mutateAsync({
          latitude,
          longitude,
          address: address || undefined,
          category: category as OccurrenceCategory,
          description,
          severity,
          imageUrl: imageUrl ?? undefined,
          imageKey: imageKey ?? undefined,
          reporterName: reporterName || undefined,
          reporterEmail: reporterEmail || undefined,
          aiClassification: aiSuggestion
            ? {
                suggestedCategory: aiSuggestion.suggestedCategory,
                suggestedSeverity: aiSuggestion.suggestedSeverity,
                confidence: aiSuggestion.confidence,
                reasoning: aiSuggestion.reasoning,
                analyzedAt: new Date().toISOString(),
              }
            : undefined,
        });
        setSubmitted(true);
        toast.success("Ocorrência registrada com sucesso!");
      } catch {
        toast.error("Erro ao registrar ocorrência. Tente novamente.");
      }
    },
    [category, latitude, longitude, description, severity, imageUrl, imageKey, address, reporterName, reporterEmail, aiSuggestion, createMutation]
  );

  // ── Success screen ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="p-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Ocorrência Registrada!</h2>
            <p className="mb-8 text-muted-foreground">
              Sua ocorrência foi registrada com sucesso e será analisada pelos gestores ambientais.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setSubmitted(false)} variant="outline">
                Registrar Outra Ocorrência
              </Button>
              <Link href="/">
                <Button className="w-full">Voltar ao Início</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif]">
      {/* Header */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">EcoMonitor</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">← Voltar</Button>
          </Link>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Registrar Ocorrência Ambiental
            </h1>
            <p className="mt-2 text-muted-foreground">
              Preencha os dados abaixo para registrar um problema ambiental na sua região.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 bg-white"
                  onClick={captureGPS}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  {latitude ? "Localização Capturada ✓" : "Capturar Localização GPS"}
                </Button>

                {gpsError && (
                  <p className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {gpsError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lat">Latitude</Label>
                    <Input
                      id="lat"
                      type="number"
                      step="any"
                      placeholder="-23.5505"
                      value={latitude ?? ""}
                      onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lng">Longitude</Label>
                    <Input
                      id="lng"
                      type="number"
                      step="any"
                      placeholder="-46.6333"
                      value={longitude ?? ""}
                      onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Endereço / Referência (opcional)</Label>
                  <Input
                    id="address"
                    placeholder="Ex: Rua das Flores, 100 — próximo ao parque"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Descrição da Ocorrência</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="desc">Descreva o problema *</Label>
                  <Textarea
                    id="desc"
                    placeholder="Descreva detalhadamente o problema ambiental observado..."
                    className="mt-1 min-h-[120px] resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description.length}/500 caracteres
                  </p>
                </div>

                {/* AI Classification */}
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                      <span className="text-sm font-medium text-violet-800">
                        Classificação por IA
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-violet-300 bg-white text-violet-700 hover:bg-violet-50"
                      onClick={runAIClassification}
                      disabled={aiLoading || description.length < 10}
                    >
                      {aiLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Analisar com IA
                    </Button>
                  </div>

                  {aiSuggestion ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 font-medium text-violet-800">
                          {CATEGORY_LABELS[aiSuggestion.suggestedCategory]}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800">
                          Gravidade: {SEVERITY_LABELS[aiSuggestion.suggestedSeverity]}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                          Confiança: {Math.round(aiSuggestion.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-violet-700">{aiSuggestion.reasoning}</p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-1 gap-1.5 bg-violet-600 hover:bg-violet-700"
                        onClick={applyAISuggestion}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Aplicar Sugestão
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-violet-600">
                      Escreva uma descrição e clique em "Analisar com IA" para sugestão automática de categoria e gravidade.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category & Severity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Classificação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as OccurrenceCategory)}
                    required
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCURRENCE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nível de Gravidade</Label>
                  <Select
                    value={severity}
                    onValueChange={(v) => setSeverity(v as SeverityLevel)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_LEVELS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SEVERITY_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-4 w-4 text-primary" />
                  Foto da Ocorrência (opcional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                    {uploadLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                    {imageUrl && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        Enviada
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Clique para adicionar foto
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG ou WEBP até 5MB
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageChange(file);
                      }}
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Reporter info */}
            {!user && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Seus Dados (opcional)</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      placeholder="Seu nome"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={createMutation.isPending || uploadLoading}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              Registrar Ocorrência
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
