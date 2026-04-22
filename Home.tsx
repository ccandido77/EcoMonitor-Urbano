import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  AlertTriangle,
  BarChart3,
  Droplets,
  Leaf,
  MapPin,
  Shield,
  Sparkles,
  TreeDeciduous,
  Wind,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: MapPin,
    title: "Registro Geolocalizado",
    description:
      "Capture automaticamente as coordenadas GPS da ocorrência ou insira manualmente o local do problema ambiental.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Sparkles,
    title: "Classificação por IA",
    description:
      "Nossa inteligência artificial analisa a descrição e imagem para sugerir automaticamente a categoria e nível de gravidade.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: BarChart3,
    title: "Painel em Tempo Real",
    description:
      "Gestores públicos acompanham estatísticas, tendências e distribuição geográfica das ocorrências em tempo real.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: Shield,
    title: "Gestão de Status",
    description:
      "Acompanhe o ciclo de vida de cada ocorrência: Pendente, Em Análise e Resolvido com histórico completo.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const categories = [
  { icon: Wind, label: "Poluição do Ar", color: "text-violet-500" },
  { icon: Droplets, label: "Poluição da Água", color: "text-sky-500" },
  { icon: AlertTriangle, label: "Resíduos", color: "text-amber-500" },
  { icon: TreeDeciduous, label: "Desmatamento", color: "text-green-500" },
  { icon: Zap, label: "Ilha de Calor", color: "text-red-500" },
  { icon: Leaf, label: "E muito mais...", color: "text-teal-500" },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background font-[Inter,sans-serif]">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-lg font-bold text-foreground">
              Ecomonitor IGEOAM
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated && user?.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  Painel Admin
                </Button>
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/my-reports">
                <Button variant="ghost" size="sm">
                  Meus Registros
                </Button>
              </Link>
            )}
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </a>
            )}
            <Link href="/report">
              <Button size="sm" className="gap-2">
                <MapPin className="h-4 w-4" />
                Registrar Ocorrência
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/20 py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Leaf className="h-3.5 w-3.5" />
              Monitoramento Ambiental Colaborativo
            </div>
            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
              Proteja o meio ambiente{" "}
              <span className="text-primary">da sua cidade</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Registre ocorrências ambientais com geolocalização, fotos e
              descrição. Nossa IA classifica automaticamente e gestores públicos
              acompanham tudo em tempo real.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/report">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  <MapPin className="h-5 w-5" />
                  Registrar Ocorrência
                </Button>
              </Link>
              {isAuthenticated && user?.role === "admin" ? (
                <Link href="/admin">
                  <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto bg-white">
                    <BarChart3 className="h-5 w-5" />
                    Acessar Painel Admin
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="lg" className="w-full gap-2 sm:w-auto bg-white">
                    Entrar como Gestor
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      </section>

      {/* ── Categories ── */}
      <section className="border-y border-border bg-muted/40 py-10">
        <div className="container">
          <p className="mb-6 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Categorias de Ocorrências
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {categories.map((cat) => (
              <div
                key={cat.label}
                className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium shadow-sm"
              >
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                <span className="text-foreground">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-bold text-foreground md:text-4xl">
              Tudo que você precisa para monitorar
            </h2>
            <p className="mt-4 text-muted-foreground">
              Uma plataforma completa para cidadãos e gestores públicos
              trabalharem juntos na preservação ambiental urbana.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <Card key={f.title} className="border-border shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
                    <f.icon className={`h-6 w-6 ${f.color}`} />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary py-20">
        <div className="container text-center">
          <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-3xl font-bold text-primary-foreground md:text-4xl">
            Comece a monitorar agora
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Qualquer cidadão pode registrar uma ocorrência. Juntos, construímos
            cidades mais sustentáveis.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/report">
              <Button
                size="lg"
                variant="secondary"
                className="w-full gap-2 sm:w-auto"
              >
                <MapPin className="h-5 w-5" />
                Registrar Ocorrência
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-white py-8">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Leaf className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Ecomonitor IGEOAM</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Plataforma colaborativa de monitoramento ambiental urbano
          </p>
        </div>
      </footer>
    </div>
  );
}
