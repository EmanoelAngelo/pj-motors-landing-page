import { getSupabase } from '@/utils/supabase';

let sessionId: string | null = null;

function generateSessionId(): string {
  const stored = sessionStorage.getItem('pj_session_id');
  if (stored) return stored;
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  sessionStorage.setItem('pj_session_id', id);
  return id;
}

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
}

type EventData = Record<string, unknown>;

// ============================================================
// CONFIGURACAO: URL e anon key do Supabase (build-time)
// ============================================================
const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

// ============================================================
// THROTTLING: evita que rajadas de eventos saturem o Supabase
// Agrupa eventos em buffer e envia em lote a cada 2 segundos
// ============================================================
interface QueuedEvent {
  event_type: string;
  page: string;
  data: EventData;
}

let eventQueue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 2000; // 2 segundos
const MAX_QUEUE_SIZE = 50;   // Descarta se acumular demais (protecao contra loop)

function flushPendingQueue(): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || eventQueue.length === 0) {
    flushTimer = null;
    return;
  }

  const batch = eventQueue.splice(0, eventQueue.length);
  const sid = getSessionId();

  const rows = batch.map((evt) => ({
    session_id: sid,
    event_type: evt.event_type,
    page: evt.page,
    data: evt.data,
  }));

  // Envio em lote com keepalive para sobreviver a navegacao
  fetch(`${SUPABASE_URL}/rest/v1/lead_events`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
    keepalive: true,
  }).catch((err) => {
    console.debug('[Tracker] flushPendingQueue fetch error:', err);
  });

  flushTimer = null;
}

function enqueueEvent(eventType: string, data: EventData, page: string): void {
  eventQueue.push({ event_type: eventType, data, page });

  // Protecao: se a fila estourar, descarta os mais antigos
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue = eventQueue.slice(-MAX_QUEUE_SIZE);
  }

  if (!flushTimer) {
    flushTimer = setTimeout(flushPendingQueue, FLUSH_INTERVAL);
  }
}

export async function track(eventType: string, data: EventData = {}, page: string = ''): Promise<void> {
  const currentPage = page || window.location.pathname;
  enqueueEvent(eventType, data, currentPage);
}

// ============================================================
// trackKeepalive — envio IMEDIATO para eventos de navegação
//
// Estratégia CORRIGIDA:
// 1. fetch com keepalive: true como método PRIMÁRIO
//    → Suporta headers customizados (apikey, Authorization)
//    → O browser garante a entrega mesmo durante navegação/antes do unload
//    → NÃO sofre do problema CORS preflight que o sendBeacon com Blob sofre
//
// O sendBeacon anterior mandava apikey como query param,
// mas o Supabase só aceita apikey como HEADER. Por isso
// TODOS os eventos de clique/navegação estavam sendo perdidos.
// ============================================================
export function trackKeepalive(eventType: string, data: EventData = {}, page: string = ''): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

  // DRENA A FILA primeiro — garante que nenhum evento pendente
  // (ex: page_view, started_session) morra durante navegacao SPA.
  // O React Router NAO dispara beforeunload, entao eventos na fila
  // seriam perdidos se o usuario navegasse antes do timer de 2s.
  flushPendingQueue();

  const currentPage = page || window.location.pathname;
  const body = JSON.stringify({
    session_id: getSessionId(),
    event_type: eventType,
    page: currentPage,
    data,
  });

  const url = `${SUPABASE_URL}/rest/v1/lead_events`;

  // fetch com keepalive — suporta headers, o browser garante entrega
  fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body,
    keepalive: true,
  }).catch((err) => {
    console.debug('[Tracker] trackKeepalive fetch error:', err);
  });
}

// ============================================================
// Garante que eventos pendentes sejam enviados antes do unload
// fetch com keepalive: true como método primário
// O browser garante a entrega mesmo durante page unload
// ============================================================
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingQueue);

  // Tambem envia quando a pagina fica em segundo plano (visibilitychange)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && eventQueue.length > 0) {
      flushPendingQueue();
    }
  });
}