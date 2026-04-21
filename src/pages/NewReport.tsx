import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category =
  | 'air_pollution' | 'water_pollution' | 'waste' | 'noise'
  | 'deforestation' | 'soil_contamination' | 'heat_island'
  | 'flooding' | 'geoglyph_degradation' | 'other';

type Severity = 'low' | 'medium' | 'high' | 'critical';

type Step = 'location' | 'category' | 'description' | 'photo' | 'severity' | 'confirm' | 'done';

interface Message {
  id: number;
  from: 'ai' | 'user';
  text: string;
  isLocation?: boolean;
  imagePreview?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'air_pollution',       label: 'Poluição do Ar',           emoji: '🌬️', color: 'bg-violet-50 border-violet-300 text-violet-800' },
  { value: 'water_pollution',     label: 'Poluição da Água',         emoji: '💧', color: 'bg-sky-50 border-sky-300 text-sky-800' },
  { value: 'waste',               label: 'Resíduos',                 emoji: '🗑️', color: 'bg-amber-50 border-amber-300 text-amber-800' },
  { value: 'noise',               label: 'Poluição Sonora',          emoji: '🔊', color: 'bg-pink-50 border-pink-300 text-pink-800' },
  { value: 'deforestation',       label: 'Desmatamento',             emoji: '🌳', color: 'bg-green-50 border-green-300 text-green-800' },
  { value: 'soil_contamination',  label: 'Contaminação do Solo',     emoji: '⚗️', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  { value: 'heat_island',         label: 'Ilha de Calor',            emoji: '🌡️', color: 'bg-red-50 border-red-300 text-red-800' },
  { value: 'flooding',            label: 'Alagamento',               emoji: '🌊', color: 'bg-blue-50 border-blue-300 text-blue-800' },
  { value: 'geoglyph_degradation',label: 'Degradação de Geoglifos',  emoji: '',   color: 'bg-stone-50 border-stone-400 text-stone-800' },
  { value: 'other',               label: 'Outro',                    emoji: '❓', color: 'bg-gray-50 border-gray-300 text-gray-700' },
];

const SEVERITIES: { value: Severity; label: string; dot: string; color: string }[] = [
  { value: 'low',      label: 'Baixa',   dot: 'bg-emerald-500', color: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
  { value: 'medium',   label: 'Média',   dot: 'bg-amber-500',   color: 'bg-amber-50 border-amber-300 text-amber-800' },
  { value: 'high',     label: 'Alta',    dot: 'bg-orange-500',  color: 'bg-orange-50 border-orange-300 text-orange-800' },
  { value: 'critical', label: 'Crítica', dot: 'bg-red-600',     color: 'bg-red-50 border-red-400 text-red-800' },
];

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

// Ícone do geoglifo: octógono + círculo interno + 4 entradas cardinais
// Inspirado nas estruturas reais descobertas no Acre (círculos, octógonos com fossas)
function GeoglyphIcon({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"
      className={className}
      aria-label="Geoglifo amazônico"
    >
      {/* Octógono exterior — representa o perímetro da vala */}
      <polygon points="9,2 15,2 22,9 22,15 15,22 9,22 2,15 2,9" />
      {/* Círculo interior — representa o montículo central */}
      <circle cx="12" cy="12" r="4" />
      {/* Entradas cardinais (N, S, L, O) — característica dos geoglifos acreanos */}
      <line x1="12" y1="2"  x2="12" y2="8"  />
      <line x1="12" y1="16" x2="12" y2="22" />
      <line x1="2"  y1="12" x2="8"  y2="12" />
      <line x1="16" y1="12" x2="22" y2="12" />
      {/* Ponto central */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewReport() {
  const [step, setStep] = useState<Step>('location');
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    from: 'ai',
    text: 'Olá! 🌿 Sou o EcoMonitor. Onde está a ocorrer o problema ambiental? Toque em 📍 para enviar a sua localização, ou escreva o endereço/referência.',
  }]);

  const [latitude, setLatitude]   = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress]     = useState('');
  const [category, setCategory]   = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity]   = useState<Severity>('medium');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submittedId, setSubmittedId]   = useState<number | null>(null);

  const [textInput, setTextInput] = useState('');
  const [loading, setLoading]     = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const messagesEnd   = useRef<HTMLDivElement>(null);
  const textInputRef  = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus text input when step changes to location/description
  useEffect(() => {
    if (step === 'location' || step === 'description') {
      setTimeout(() => textInputRef.current?.focus(), 300);
    }
  }, [step]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const pushMsg = useCallback((from: Message['from'], text: string, extra?: Partial<Message>) => {
    setMessages(prev => [...prev, { id: Date.now(), from, text, ...extra }]);
  }, []);

  const aiReply = useCallback((text: string, delayMs = 600) => {
    setTimeout(() => pushMsg('ai', text), delayMs);
  }, [pushMsg]);

  // ── Location ─────────────────────────────────────────────────────────────

  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      aiReply('⚠️ GPS não suportado neste dispositivo. Por favor, escreva o endereço.', 0);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGpsLoading(false);
        pushMsg('user', `📍 Localização GPS enviada`, { isLocation: true });
        aiReply('Localização recebida! ✅ Agora, qual é o tipo de ocorrência? Selecione uma categoria:');
        setStep('category');
      },
      () => {
        setGpsLoading(false);
        aiReply('⚠️ Não consegui aceder ao GPS. Pode escrever o endereço ou referência local.', 0);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, [pushMsg, aiReply]);

  // ── Text send ─────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput('');

    if (step === 'location') {
      setAddress(text);
      // Use São Paulo coords as default for address-only input
      setLatitude(-23.5505);
      setLongitude(-46.6333);
      pushMsg('user', `📍 ${text}`, { isLocation: true });
      aiReply('Endereço registado! ✅ Agora, qual é o tipo de ocorrência? Selecione uma categoria:');
      setStep('category');
    } else if (step === 'description') {
      if (text.length < 10) {
        aiReply('Por favor, descreva com pelo menos 10 caracteres para uma melhor análise.', 0);
        setTextInput(text);
        return;
      }
      setDescription(text);
      pushMsg('user', text);
      aiReply('Ótima descrição! 📸 Tem alguma foto da situação? Toque em 📷 para adicionar, ou "Pular" para continuar.');
      setStep('photo');
    }
  }, [textInput, step, pushMsg, aiReply]);

  // ── Category ─────────────────────────────────────────────────────────────

  const selectCategory = useCallback((cat: Category) => {
    const info = CATEGORIES.find(c => c.value === cat)!;
    setCategory(cat);
    const label = cat === 'geoglyph_degradation' ? '⬡ Degradação de Geoglifos' : `${info.emoji} ${info.label}`;
    pushMsg('user', label);
    aiReply('Perfeito! 📝 Agora descreva o que observou. Quanto mais detalhes, melhor para os gestores ambientais!');
    setStep('description');
  }, [pushMsg, aiReply]);

  // ── Photo ─────────────────────────────────────────────────────────────────

  const handleImageChange = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      aiReply('⚠️ Imagem grande demais (máx. 5MB). Tente outra foto.', 0);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setImagePreview(preview);
      pushMsg('user', '📷 Foto anexada', { imagePreview: preview });
      aiReply('Foto recebida! 🚦 Qual é o nível de urgência do problema?');
      setStep('severity');
    };
    reader.readAsDataURL(file);
  }, [pushMsg, aiReply]);

  const skipPhoto = useCallback(() => {
    pushMsg('user', 'Sem foto por enquanto');
    aiReply('Sem problema! 🚦 Qual é o nível de urgência do problema?');
    setStep('severity');
  }, [pushMsg, aiReply]);

  // ── Severity ─────────────────────────────────────────────────────────────

  const selectSeverity = useCallback((sev: Severity) => {
    const info = SEVERITIES.find(s => s.value === sev)!;
    setSeverity(sev);
    pushMsg('user', `🔖 Gravidade: ${info.label}`);
    aiReply('✅ Tudo pronto! Revise o resumo abaixo e confirme o envio.');
    setStep('confirm');
  }, [pushMsg, aiReply]);

  // ── Submit → MySQL via Express API ────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!latitude || !longitude || !category || !description) return;
    setLoading(true);
    pushMsg('user', '📤 Enviando ocorrência...');

    try {
      const res = await fetch('/api/occurrences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          address: address || null,
          category,
          description,
          severity,
          imageUrl: null,
          imageKey: null,
          reporterName: null,
          reporterEmail: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro no servidor');

      setSubmittedId(data.occurrence?.id ?? null);
      aiReply(`🎉 Ocorrência #${data.occurrence?.id ?? '—'} registada com sucesso no sistema! Obrigado por cuidar do ambiente. 🌿`);
      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      aiReply(`❌ Falha ao registar: ${msg}. Verifique se o servidor está a correr e tente novamente.`);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, category, description, severity, address, pushMsg, aiReply]);

  // ── Helpers for summary ──────────────────────────────────────────────────

  const categoryInfo = CATEGORIES.find(c => c.value === category);
  const severityInfo = SEVERITIES.find(s => s.value === severity);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#efeae2] overflow-hidden">

      {/* ── WhatsApp-style Header ──────────────────────────────────────────── */}
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 text-white shadow-md flex-shrink-0 z-10">
        <a
          href="/"
          className="text-white/70 hover:text-white transition-colors text-lg leading-none"
          aria-label="Voltar"
        >
          ←
        </a>

        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#128c7e] flex items-center justify-center flex-shrink-0 shadow-inner">
          <LeafIcon />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] leading-tight truncate">
            Novo Relato Ambiental
          </h1>
          <p className="text-[11px] text-white/60 leading-tight">
            {step === 'done' ? '✅ Concluído' : 'IA EcoMonitor • em linha'}
          </p>
        </div>
      </div>

      {/* ── Chat Area ─────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='%23d1fae5' fill-opacity='0'/%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z' fill='%23c4e1c4' fill-opacity='0.15'/%3E%3C/svg%3E")`,
        }}
      >
        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex chat-bubble-enter ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.from === 'ai' ? (
              <div className="bg-white rounded-lg rounded-tl-none shadow-sm max-w-[80%] px-3 py-2">
                <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                <span className="text-[10px] text-gray-400 block text-right mt-0.5">EcoMonitor IA</span>
              </div>
            ) : msg.imagePreview ? (
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none shadow-sm overflow-hidden max-w-[220px] border border-green-200">
                <img src={msg.imagePreview} alt="Foto da ocorrência" className="w-full h-36 object-cover" />
                <p className="text-xs px-2 py-1.5 text-gray-700">{msg.text}</p>
                <span className="text-[10px] text-green-600 block text-right px-2 pb-1.5">✓✓</span>
              </div>
            ) : msg.isLocation ? (
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none shadow-sm border border-green-200 px-3 py-2 flex items-center gap-2 max-w-[80%]">
                <span className="text-[#00a884]"><MapPinIcon /></span>
                <span className="text-sm text-gray-800">{msg.text}</span>
                <span className="text-[10px] text-green-600 ml-1">✓✓</span>
              </div>
            ) : (
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none shadow-sm border border-green-200 px-3 py-2 max-w-[80%]">
                <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                <span className="text-[10px] text-green-600 block text-right mt-0.5">✓✓</span>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {gpsLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="ml-2 text-xs text-gray-500">A obter GPS…</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Category grid ─────────────────────────────────────────────── */}
        {step === 'category' && (
          <div className="grid grid-cols-2 gap-2 mt-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => selectCategory(cat.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center
                  shadow-sm active:scale-95 transition-all hover:shadow-md ${cat.color}`}
              >
                {cat.value === 'geoglyph_degradation' ? (
                  <GeoglyphIcon size={28} className="text-stone-700" />
                ) : (
                  <span className="text-2xl leading-none">{cat.emoji}</span>
                )}
                <span className="text-[11px] font-medium leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Severity chips ────────────────────────────────────────────── */}
        {step === 'severity' && (
          <div className="flex flex-wrap justify-end gap-2 mt-1 px-1">
            {SEVERITIES.map((sev) => (
              <button
                key={sev.value}
                onClick={() => selectSeverity(sev.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-medium text-sm
                  shadow-sm active:scale-95 transition-all ${sev.color}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                {sev.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Confirm summary card ──────────────────────────────────────── */}
        {step === 'confirm' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-1 mt-1">
            <div className="bg-[#075e54]/10 px-4 py-2.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-[#075e54] uppercase tracking-wide">Resumo da Ocorrência</p>
            </div>
            <div className="divide-y divide-gray-50">
              <SummaryRow label="Localização" value={address || `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}`} />
              <SummaryRow
                label="Categoria"
                value={
                  <span className="flex items-center gap-1.5">
                    {category === 'geoglyph_degradation'
                      ? <GeoglyphIcon size={14} className="text-stone-700" />
                      : categoryInfo?.emoji}
                    {categoryInfo?.label}
                  </span>
                }
              />
              <SummaryRow
                label="Gravidade"
                value={
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${severityInfo?.dot}`} />
                    {severityInfo?.label}
                  </span>
                }
              />
              <SummaryRow label="Descrição" value={description} />
              {imagePreview && (
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0">Foto</span>
                  <img src={imagePreview} alt="preview" className="w-10 h-10 object-cover rounded" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Done screen ───────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center py-6 gap-4 px-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
              <span className="text-5xl">🌿</span>
            </div>
            {submittedId && (
              <p className="text-xs text-gray-500 bg-white rounded-full px-3 py-1 shadow-sm">
                Registo #{submittedId} salvo no Laragon
              </p>
            )}
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={() => {
                  setStep('location');
                  setMessages([{ id: Date.now(), from: 'ai', text: 'Olá! 🌿 Sou o EcoMonitor. Onde está a ocorrer o problema ambiental? Toque em 📍 para enviar a sua localização, ou escreva o endereço/referência.' }]);
                  setLatitude(null); setLongitude(null); setAddress('');
                  setCategory(null); setDescription(''); setSeverity('medium');
                  setImagePreview(null); setSubmittedId(null);
                }}
                className="bg-[#00a884] text-white py-3 rounded-full font-medium shadow-lg text-center active:scale-95 transition-all"
              >
                + Registar outra ocorrência
              </button>
              <a
                href="/"
                className="bg-white text-gray-700 border border-gray-200 py-3 rounded-full font-medium shadow-sm text-center block"
              >
                Voltar ao início
              </a>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* ── Bottom Input Bar ──────────────────────────────────────────────── */}
      {step !== 'done' && (
        <div className="bg-[#f0f0f0] px-2 py-2 flex items-end gap-1.5 flex-shrink-0 border-t border-gray-300">

          {/* Camera button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={step !== 'photo' && step !== 'description'}
            className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
              step === 'photo'
                ? 'text-[#00a884] bg-emerald-50 hover:bg-emerald-100 shadow-sm'
                : 'text-gray-500 hover:bg-gray-200 disabled:opacity-30'
            }`}
            title="Adicionar foto"
          >
            <CameraIcon />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageChange(file);
              e.target.value = '';
            }}
          />

          {/* Dynamic center area */}
          {step === 'photo' ? (
            <button
              onClick={skipPhoto}
              className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-gray-500 text-left shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Pular esta etapa →
            </button>
          ) : step === 'confirm' ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#00a884] text-white rounded-full px-4 py-2.5 text-sm font-semibold text-center shadow-md active:scale-95 transition-all disabled:opacity-70"
            >
              {loading ? '⏳ A enviar…' : '🌿 Confirmar e Registar'}
            </button>
          ) : step === 'category' || step === 'severity' ? (
            <div className="flex-1 bg-white/70 rounded-full px-4 py-2.5 text-sm text-gray-400 shadow-sm border border-gray-200">
              {step === 'category' ? 'Selecione uma categoria acima' : 'Selecione o nível acima'}
            </div>
          ) : (
            <input
              ref={textInputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
              placeholder={step === 'location' ? 'Escreva o endereço…' : 'Descreva o problema…'}
              className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm border border-gray-200 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent
                placeholder:text-gray-400"
            />
          )}

          {/* GPS button — only for location step */}
          {step === 'location' && (
            <button
              onClick={captureGPS}
              disabled={gpsLoading}
              className="p-2.5 rounded-full text-[#00a884] hover:bg-emerald-50 transition-colors flex-shrink-0 disabled:opacity-40"
              title="Usar GPS"
            >
              <MapPinIcon />
            </button>
          )}

          {/* Send button — location & description steps */}
          {(step === 'location' || step === 'description') && (
            <button
              onClick={handleSend}
              disabled={!textInput.trim() || loading}
              className="bg-[#00a884] p-2.5 rounded-full text-white shadow-md
                active:scale-95 transition-all disabled:opacity-40 disabled:bg-gray-400 flex-shrink-0"
              title="Enviar"
            >
              <SendIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Summary row helper ───────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-2.5 flex items-start gap-3">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-700 leading-snug flex-1">{value}</span>
    </div>
  );
}
