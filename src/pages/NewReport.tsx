import { useState, useRef, useCallback, useEffect } from 'react';

// Som "pop" estilo WhatsApp gerado via Web Audio API (sem ficheiro externo)
function playPop() {
  try {
    const ctx = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close();
  } catch { /* browser sem Web Audio API */ }
}

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
  isAudio?: boolean;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'geoglyph_degradation',label: 'Degradação de Geoglifos',  emoji: '',   color: 'bg-stone-50 border-stone-400 text-stone-800' },
  { value: 'deforestation',       label: 'Desmatamento',             emoji: '🌳', color: 'bg-green-50 border-green-300 text-green-800' },
  { value: 'air_pollution',       label: 'Poluição do Ar',           emoji: '🌬️', color: 'bg-violet-50 border-violet-300 text-violet-800' },
  { value: 'water_pollution',     label: 'Poluição da Água',         emoji: '💧', color: 'bg-sky-50 border-sky-300 text-sky-800' },
  { value: 'waste',               label: 'Resíduos',                 emoji: '🗑️', color: 'bg-amber-50 border-amber-300 text-amber-800' },
  { value: 'noise',               label: 'Poluição Sonora',          emoji: '🔊', color: 'bg-pink-50 border-pink-300 text-pink-800' },
  { value: 'soil_contamination',  label: 'Contaminação do Solo',     emoji: '⚗️', color: 'bg-yellow-50 border-yellow-300 text-yellow-800' },
  { value: 'heat_island',         label: 'Queimadas',                emoji: '🔥', color: 'bg-red-50 border-red-300 text-red-800' },
  { value: 'flooding',            label: 'Alagamento',               emoji: '🌊', color: 'bg-blue-50 border-blue-300 text-blue-800' },
  { value: 'other',               label: 'Outro',                    emoji: '❓', color: 'bg-gray-50 border-gray-300 text-gray-700' },
];

const SEVERITIES: { value: Severity; label: string; dot: string; color: string }[] = [
  { value: 'low',      label: 'Baixa',   dot: 'bg-emerald-500', color: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
  { value: 'medium',   label: 'Média',   dot: 'bg-amber-500',   color: 'bg-amber-50 border-amber-300 text-amber-800' },
  { value: 'high',     label: 'Alta',    dot: 'bg-orange-500',  color: 'bg-orange-50 border-orange-300 text-orange-800' },
  { value: 'critical', label: 'Crítica', dot: 'bg-red-600',     color: 'bg-red-50 border-red-400 text-red-800' },
];

function fmtSecs(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.65"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className="animate-spin" style={{ transformOrigin: 'center' }}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// Ícone baseado nas formas geométricas do logo do Instituto Geoglifos da Amazônia:
// cruz com quadrados terminais em cada extremidade + rectângulo oco central.
function GeoglyphIcon({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="square" strokeLinejoin="miter"
      className={className}
      aria-label="Instituto Geoglifos da Amazônia"
    >
      <line x1="12" y1="6"  x2="12" y2="9"  />
      <line x1="12" y1="15" x2="12" y2="18" />
      <line x1="6"  y1="12" x2="9"  y2="12" />
      <line x1="15" y1="12" x2="18" y2="12" />
      <rect x="9" y="9" width="6" height="6" />
      <rect x="9.5" y="2"   width="5" height="4" fill="currentColor" stroke="none" />
      <rect x="9.5" y="18"  width="5" height="4" fill="currentColor" stroke="none" />
      <rect x="2"   y="9.5" width="4" height="5" fill="currentColor" stroke="none" />
      <rect x="18"  y="9.5" width="4" height="5" fill="currentColor" stroke="none" />
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
    text: 'Olá! 🌿 Sou o Ecomonitor IGEOAM. Onde está a ocorrer o problema ambiental? Toque em 📍 para enviar a sua localização, ou escreva o endereço/referência.',
  }]);

  // Form state
  const [latitude, setLatitude]   = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress]     = useState('');
  const [category, setCategory]   = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [severity, setSeverity]   = useState<Severity>('medium');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submittedId, setSubmittedId]   = useState<number | null>(null);
  const [audioBlob, setAudioBlob]       = useState<Blob | null>(null);
  const [photoFile, setPhotoFile]       = useState<File | null>(null);

  // UI state
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading]     = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording]     = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [recordingSecs, setRecordingSecs] = useState(0);

  // Refs
  const fileInputRef    = useRef<HTMLInputElement>(null);  // photo step
  const descFileRef     = useRef<HTMLInputElement>(null);  // photo as description
  const messagesEnd     = useRef<HTMLDivElement>(null);
  const textInputRef    = useRef<HTMLInputElement>(null);
  const recognitionRef  = useRef<SpeechRecognition | null>(null);
  const timerRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const audioChunksRef     = useRef<Blob[]>([]);

  // Auto-scroll
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Som "pop" quando chega nova mensagem da IA (ignora a mensagem inicial)
  const aiMsgCount = useRef(1);
  useEffect(() => {
    const n = messages.filter(m => m.from === 'ai').length;
    if (n > aiMsgCount.current) {
      aiMsgCount.current = n;
      playPop();
    }
  }, [messages]);

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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setGpsLoading(false);
        console.log('[GPS] Coords obtidas:', lat, lng);
        pushMsg('user', '📍 Localização GPS enviada', { isLocation: true });
        aiReply('Localização recebida! ✅ Agora, qual é o tipo de ocorrência? Selecione uma categoria:');
        setStep('category');
      },
      (error) => {
        setGpsLoading(false);
        console.log('[GPS Error] código:', error.code, '| mensagem:', error.message);
        let msg: string;
        if (error.code === 1) {
          msg = '⚠️ Permissão de localização negada. Active o GPS nas definições do dispositivo e tente novamente.';
        } else if (error.code === 2) {
          msg = '⚠️ Sinal de GPS fraco ou indisponível. Tente ao ar livre ou escreva o endereço manualmente.';
        } else if (error.code === 3) {
          msg = '⚠️ Tempo de resposta do GPS excedido. Verifique o sinal e tente novamente.';
        } else {
          msg = '⚠️ Não foi possível aceder ao GPS. Pode escrever o endereço ou referência local.';
        }
        aiReply(msg, 0);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [pushMsg, aiReply]);

  // ── Text send ─────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput('');

    if (step === 'location') {
      setAddress(text);
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
      aiReply('Descrição recebida! 📸 Quer adicionar uma foto da situação? (Opcional)');
      setStep('photo');
    }
  }, [textInput, step, pushMsg, aiReply]);

  // ── Category ─────────────────────────────────────────────────────────────

  const selectCategory = useCallback((cat: Category) => {
    const info = CATEGORIES.find(c => c.value === cat)!;
    setCategory(cat);
    const label = cat === 'geoglyph_degradation' ? '⬡ Degradação de Geoglifos' : `${info.emoji} ${info.label}`;
    pushMsg('user', label);
    aiReply('Perfeito! Como prefere descrever o que observou? Pode ✍️ escrever, 🎤 gravar um áudio ou 📷 enviar uma foto — use os botões abaixo:');
    setStep('description');
  }, [pushMsg, aiReply]);

  // ── Audio recording ───────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    // MediaRecorder: captura o blob de áudio real
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch {
      aiReply('⚠️ Não foi possível aceder ao microfone para gravar áudio.', 0);
    }

    // SpeechRecognition: transcrição em tempo real (opcional)
    const SR = (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
      .SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;

    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-BR';

      let finalText = '';
      rec.onresult = (e: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
          else interim = e.results[i][0].transcript;
        }
        setAudioTranscript(finalText + interim);
      };
      rec.onerror = () => {
        setIsRecording(false);
        clearInterval(timerRef.current!);
      };
      rec.onend = () => {
        setIsRecording(false);
        clearInterval(timerRef.current!);
      };
      recognitionRef.current = rec;
      rec.start();
    }

    setIsRecording(true);
    setAudioTranscript('');
    setRecordingSecs(0);
    timerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
  }, [aiReply]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current!);
  }, []);

  const confirmAudio = useCallback(() => {
    const text = audioTranscript.trim();
    if (text.length < 3) {
      aiReply('⚠️ Transcrição muito curta. Tente gravar novamente ou escreva a descrição.', 0);
      setAudioTranscript('');
      return;
    }
    setDescription(text);
    const preview = text.length > 80 ? `${text.slice(0, 80)}…` : text;
    pushMsg('user', `🎤 ${preview}`, { isAudio: true });
    setAudioTranscript('');
    aiReply('Áudio transcrito com sucesso! ✅ 📸 Quer adicionar uma foto da situação? (Opcional)');
    setStep('photo');
  }, [audioTranscript, pushMsg, aiReply]);

  const resetAudio = useCallback(() => {
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setAudioTranscript('');
    setAudioBlob(null);
    setRecordingSecs(0);
    clearInterval(timerRef.current!);
  }, []);

  // ── Photo as description (skips dedicated photo step) ────────────────────

  const handleDescriptionPhoto = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      aiReply('⚠️ Imagem grande demais (máx. 5MB). Tente outra foto.', 0);
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setImagePreview(preview);
      if (!description) setDescription('Ocorrência registada por foto.');
      pushMsg('user', '📷 Foto enviada como descrição', { imagePreview: preview });
      aiReply('Foto recebida e confirmada! ✅ 🚦 Qual é o nível de urgência do problema?');
      setStep('severity');
    };
    reader.readAsDataURL(file);
  }, [description, pushMsg, aiReply]);

  // ── Photo (optional, after text/audio description) ────────────────────────

  const handleImageChange = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      aiReply('⚠️ Imagem grande demais (máx. 5MB). Tente outra foto.', 0);
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setImagePreview(preview);
      pushMsg('user', '📷 Foto anexada', { imagePreview: preview });
      aiReply('Foto recebida! ✅ 🚦 Qual é o nível de urgência do problema?');
      setStep('severity');
    };
    reader.readAsDataURL(file);
  }, [pushMsg, aiReply]);

  const skipPhoto = useCallback(() => {
    pushMsg('user', 'Sem foto por enquanto');
    aiReply('Ok! 🚦 Qual é o nível de urgência do problema?');
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

  // ── Submit → MySQL ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!latitude || !longitude || !category || !description) return;
    setLoading(true);
    pushMsg('user', '📤 Enviando ocorrência…');

    try {
      const formData = new FormData();
      formData.append('latitude', String(latitude));
      formData.append('longitude', String(longitude));
      formData.append('address', address || '');
      formData.append('category', category);
      formData.append('description', description);
      formData.append('severity', severity);
      if (photoFile) formData.append('photo', photoFile);
      if (audioBlob) formData.append('audio', audioBlob, 'gravacao.ogg');

      const res = await fetch('/api/occurrences', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro no servidor');
      setSubmittedId(data.occurrence?.id ?? null);
      aiReply(`🎉 Ocorrência #${data.occurrence?.id ?? '—'} registada com sucesso! Obrigado por cuidar do ambiente. 🌿`);
      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      aiReply(`❌ Falha ao registar: ${msg}. Verifique se o servidor está a correr e tente novamente.`);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, category, description, severity, address, photoFile, audioBlob, pushMsg, aiReply]);

  // ── Summary helpers ───────────────────────────────────────────────────────

  const categoryInfo = CATEGORIES.find(c => c.value === category);
  const severityInfo = SEVERITIES.find(s => s.value === severity);

  // Bottom bar state flags
  const descDefault     = step === 'description' && !isRecording && !audioTranscript;
  const descRecording   = step === 'description' && isRecording;
  const descTranscript  = step === 'description' && !isRecording && !!audioTranscript;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-[#efeae2] overflow-hidden">

      {/* Header */}
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-3 text-white shadow-md flex-shrink-0 z-10">
        <a href="/" className="text-white/70 hover:text-white transition-colors text-lg leading-none" aria-label="Voltar">←</a>
        <div className="w-10 h-10 rounded-full bg-[#128c7e] flex items-center justify-center flex-shrink-0 shadow-inner">
          <LeafIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-[15px] leading-tight truncate">Novo Relato Ambiental</h1>
          <p className="text-xs text-white/60 leading-tight">
            {step === 'done' ? '✅ Concluído' : 'IA Ecomonitor IGEOAM • em linha'}
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z' fill='%23c4e1c4' fill-opacity='0.15'/%3E%3C/svg%3E")` }}
      >
        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex chat-bubble-enter ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.from === 'ai' ? (
              <div className="bg-white rounded-lg rounded-tl-none shadow-sm max-w-[80%] px-3 py-2">
                <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                <span className="text-xs text-gray-400 block text-right mt-0.5">Ecomonitor IGEOAM IA</span>
              </div>
            ) : msg.imagePreview ? (
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none shadow-sm overflow-hidden max-w-[220px] border border-green-200">
                <img src={msg.imagePreview} alt="Foto" className="w-full h-36 object-cover" />
                <p className="text-xs px-2 py-1.5 text-gray-700">{msg.text}</p>
                <span className="text-xs text-[#53bdeb] block text-right px-2 pb-1.5">✓✓</span>
              </div>
            ) : msg.isLocation ? (
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none shadow-sm border border-green-200 px-3 py-2 flex items-center gap-2 max-w-[80%]">
                <span className="text-[#00a884]"><MapPinIcon /></span>
                <span className="text-sm text-gray-800">{msg.text}</span>
                <span className="text-xs text-[#53bdeb] ml-1">✓✓</span>
              </div>
            ) : msg.isAudio ? (
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none shadow-sm border border-green-200 px-3 py-2 max-w-[80%]">
                <div className="flex items-start gap-1.5 mb-0.5">
                  <span className="text-[#00a884] mt-0.5 flex-shrink-0"><MicIcon /></span>
                  <p className="text-sm text-gray-800 leading-relaxed italic">{msg.text}</p>
                </div>
                <span className="text-xs text-[#53bdeb] block text-right">✓✓</span>
              </div>
            ) : (
              <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none shadow-sm border border-green-200 px-3 py-2 max-w-[80%]">
                <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                <span className="text-xs text-[#53bdeb] block text-right mt-0.5">✓✓</span>
              </div>
            )}
          </div>
        ))}

        {/* GPS loading dots */}
        {gpsLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg rounded-tl-none shadow-sm px-4 py-3 flex gap-1 items-center">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-2 text-xs text-gray-500">A obter GPS…</span>
            </div>
          </div>
        )}

        {/* Live recording indicator in chat */}
        {descRecording && (
          <div className="flex justify-center">
            <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-red-200 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-sm font-semibold text-red-500">{fmtSecs(recordingSecs)}</span>
              {audioTranscript && (
                <span className="text-xs text-gray-500 italic max-w-[200px] truncate">
                  "{audioTranscript}"
                </span>
              )}
            </div>
          </div>
        )}

        {/* Category grid */}
        {step === 'category' && (
          <div className="grid grid-cols-2 gap-2 mt-1 px-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => selectCategory(cat.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center shadow-sm active:scale-95 transition-all hover:shadow-md ${cat.color}`}
              >
                {cat.value === 'geoglyph_degradation'
                  ? <GeoglyphIcon size={28} className="text-stone-700" />
                  : <span className="text-2xl leading-none">{cat.emoji}</span>}
                <span className="text-xs font-medium leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Severity chips */}
        {step === 'severity' && (
          <div className="flex flex-wrap justify-end gap-2 mt-1 px-1">
            {SEVERITIES.map((sev) => (
              <button
                key={sev.value}
                onClick={() => selectSeverity(sev.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-medium text-sm shadow-sm active:scale-95 transition-all ${sev.color}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                {sev.label}
              </button>
            ))}
          </div>
        )}

        {/* Confirm summary */}
        {step === 'confirm' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mx-1 mt-1">
            <div className="bg-[#075e54]/10 px-4 py-2.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-[#075e54] uppercase tracking-wide">Resumo da Ocorrência</p>
            </div>
            <div className="divide-y divide-gray-50">
              <SummaryRow label="Localização" value={address || `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}`} />
              <SummaryRow label="Categoria" value={
                <span className="flex items-center gap-1.5">
                  {category === 'geoglyph_degradation' ? <GeoglyphIcon size={14} className="text-stone-700" /> : categoryInfo?.emoji}
                  {categoryInfo?.label}
                </span>
              } />
              <SummaryRow label="Gravidade" value={
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${severityInfo?.dot}`} />
                  {severityInfo?.label}
                </span>
              } />
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

        {/* Done screen */}
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
                  setMessages([{ id: Date.now(), from: 'ai', text: 'Olá! 🌿 Sou o Ecomonitor IGEOAM. Onde está a ocorrer o problema ambiental? Toque em 📍 para enviar a sua localização, ou escreva o endereço/referência.' }]);
                  setLatitude(null); setLongitude(null); setAddress('');
                  setCategory(null); setDescription(''); setSeverity('medium');
                  setImagePreview(null); setSubmittedId(null);
                  setAudioTranscript(''); setIsRecording(false);
                  setAudioBlob(null); setPhotoFile(null);
                }}
                className="bg-[#00a884] text-white py-3 rounded-full font-medium shadow-lg text-center active:scale-95 transition-all"
              >
                + Registar outra ocorrência
              </button>
              <a href="/" className="bg-white text-gray-700 border border-gray-200 py-3 rounded-full font-medium shadow-sm text-center block">
                Voltar ao início
              </a>
            </div>
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* ── Bottom Input Bar ──────────────────────────────────────────────── */}
      {step !== 'done' && (
        <div className="bg-[#f0f0f0] px-2 py-2 flex items-center gap-1.5 flex-shrink-0 border-t border-gray-300"
             style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>

          {/* ── Left button ─────────────────────────────────────────────── */}

          {/* Location step: GPS button on the left — keeps all 3 elements visible */}
          {step === 'location' && (
            <button
              onClick={captureGPS}
              disabled={gpsLoading}
              title={gpsLoading ? 'A obter GPS…' : 'Usar localização GPS'}
              className={`p-3 rounded-full transition-all flex-shrink-0 ${
                gpsLoading
                  ? 'text-[#00a884] opacity-60'
                  : 'text-[#00a884] hover:bg-emerald-50 active:bg-emerald-100'
              }`}
            >
              {gpsLoading ? <SpinnerIcon /> : <MapPinIcon />}
            </button>
          )}

          {/* Description step: mic / stop / re-record */}
          {descDefault && (
            <button onClick={startRecording} title="Gravar áudio"
              className="p-3 rounded-full text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0">
              <MicIcon />
            </button>
          )}
          {descRecording && (
            <button onClick={stopRecording} title="Parar gravação"
              className="p-3 rounded-full bg-red-500 text-white shadow-md animate-pulse flex-shrink-0">
              <StopIcon />
            </button>
          )}
          {descTranscript && (
            <button onClick={resetAudio} title="Gravar novamente"
              className="p-3 rounded-full text-amber-600 hover:bg-amber-50 transition-colors flex-shrink-0">
              <RefreshIcon />
            </button>
          )}

          {/* Other steps (not location, not description): camera */}
          {step !== 'location' && !descDefault && !descRecording && !descTranscript && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={step !== 'photo'}
              className={`p-3 rounded-full transition-all flex-shrink-0 ${
                step === 'photo'
                  ? 'text-[#00a884] bg-emerald-50 hover:bg-emerald-100 shadow-sm'
                  : 'text-gray-400 disabled:opacity-30'
              }`}
              title="Adicionar foto"
            >
              <CameraIcon />
            </button>
          )}

          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageChange(f); e.target.value = ''; }}
          />
          <input ref={descFileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDescriptionPhoto(f); e.target.value = ''; }}
          />

          {/* ── Centre area ─────────────────────────────────────────────── */}

          {/* Recording: live transcript preview */}
          {descRecording && (
            <div className="flex-1 bg-white rounded-full px-3 py-2.5 flex items-center gap-2 shadow-sm border border-red-200 min-w-0">
              <span className="text-xs font-mono text-red-500 flex-shrink-0">{fmtSecs(recordingSecs)}</span>
              <span className="text-xs text-gray-500 italic truncate flex-1">
                {audioTranscript || 'A ouvir…'}
              </span>
            </div>
          )}

          {/* Transcript ready: preview pill */}
          {descTranscript && (
            <div className="flex-1 bg-[#dcf8c6] rounded-full px-3 py-2.5 flex items-center gap-1.5 shadow-sm border border-green-300 min-w-0">
              <span className="text-[#00a884] flex-shrink-0"><MicIcon /></span>
              <span className="text-xs text-gray-700 italic truncate flex-1">
                "{audioTranscript.length > 60 ? `${audioTranscript.slice(0, 60)}…` : audioTranscript}"
              </span>
            </div>
          )}

          {/* Default description / other steps: text input */}
          {(descDefault || (step !== 'description' && step !== 'photo' && step !== 'confirm' && step !== 'category' && step !== 'severity')) && (
            <input
              ref={textInputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(); }}
              placeholder={step === 'location' ? 'Escreva o endereço…' : 'Descreva o problema… (opcional se enviar áudio/foto)'}
              className="flex-1 min-w-0 bg-white rounded-full px-4 py-2.5 text-[16px] border border-gray-200 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-[#00a884] focus:border-transparent
                placeholder:text-gray-400"
            />
          )}

          {/* Photo step: skip */}
          {step === 'photo' && (
            <button onClick={skipPhoto}
              className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm text-gray-500 text-left shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
              Pular esta etapa →
            </button>
          )}

          {/* Confirm step: submit */}
          {step === 'confirm' && (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-[#00a884] text-white rounded-full px-4 py-2.5 text-sm font-semibold text-center shadow-md active:scale-95 transition-all disabled:opacity-70">
              {loading ? '⏳ A enviar…' : '🌿 Confirmar e Registar'}
            </button>
          )}

          {/* Category / severity: placeholder */}
          {(step === 'category' || step === 'severity') && (
            <div className="flex-1 bg-white/70 rounded-full px-4 py-2.5 text-sm text-gray-400 shadow-sm border border-gray-200">
              {step === 'category' ? 'Selecione uma categoria acima' : 'Selecione o nível acima'}
            </div>
          )}

          {/* ── Right buttons ────────────────────────────────────────────── */}

          {/* Description + photo upload button */}
          {descDefault && (
            <button onClick={() => descFileRef.current?.click()} title="Enviar foto como descrição"
              className="p-3 rounded-full text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0">
              <CameraIcon />
            </button>
          )}

          {/* Transcript confirm button */}
          {descTranscript && (
            <button onClick={confirmAudio} title="Confirmar áudio"
              className="bg-[#00a884] p-3 rounded-full text-white shadow-md active:scale-95 transition-all flex-shrink-0">
              <CheckIcon />
            </button>
          )}

          {/* Send button for location / description text */}
          {(step === 'location' || descDefault) && (
            <button
              onClick={handleSend}
              disabled={!textInput.trim() || loading}
              className="bg-[#00a884] p-3 rounded-full text-white shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:bg-gray-400 flex-shrink-0"
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

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-4 py-2.5 flex items-start gap-3">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 leading-snug flex-1">{value}</span>
    </div>
  );
}
