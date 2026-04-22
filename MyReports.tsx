import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  AlertCircle,
  Leaf,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import { Link } from "wouter";
import { CategoryBadge, SeverityBadge, StatusBadge } from "@/components/OccurrenceBadges";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MyReports() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data, isLoading } = trpc.occurrences.myOccurrences.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <AlertCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
          <p className="mt-2 text-muted-foreground">
            Faça login para ver seus registros de ocorrências.
          </p>
        </div>
        <a href={getLoginUrl()}>
          <Button>Fazer Login</Button>
        </a>
        <Link href="/">
          <Button variant="ghost">← Voltar ao Início</Button>
        </Link>
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
            <span className="font-bold text-foreground">Ecomonitor IGEOAM</span>
          </Link>
          <Link href="/report">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Ocorrência
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Registros</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Olá, {user?.name}! Aqui estão suas ocorrências registradas.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {data?.total ?? 0} registros
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold text-foreground">Nenhum registro ainda</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Você ainda não registrou nenhuma ocorrência ambiental.
            </p>
            <Link href="/report">
              <Button className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Registrar Primeira Ocorrência
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => (
              <Card key={item.id} className="overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt="Ocorrência"
                    className="h-40 w-full object-cover"
                  />
                )}
                <CardContent className="p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <CategoryBadge category={item.category} />
                    <SeverityBadge severity={item.severity} />
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-foreground">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {item.address || `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
