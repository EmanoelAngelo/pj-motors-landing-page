import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { track, trackKeepalive } from '@/utils/tracker';
import { metaPixelPageView, metaPixel } from '@/utils/metaPixel';

// ============================================================
// URLs dos videos
// ============================================================
const VIDEOS = {
  mobileTall:
    'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/8f23e6a4-0247-4877-bf80-9915b49eebc6_Abertura-celular-1080-x-2400-px.mp4',
  mobileMedium:
    'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/c3f056cb-07e4-4405-8c27-e4852010ecfc_Abertura-celular--1080-x-2160-px.mp4',
  mobileFallback:
    'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/4db95f12-8ce5-4ea1-ae3d-d681bf869ec5_Abertura-celular.mp4',
  tablet:
    'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/3ec3b275-51e6-4e38-9824-50ca1636f2c6_abertura-tablet-horizontal.mp4',
  desktop:
    'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/1a35de8a-e277-410c-a441-78f1bd9872aa_abertura-computador.mp4',
};

const LOGO_URL =
  'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/19580dc7-6a4a-4a39-b7ed-d9ce9dd15954_compressed_Capa-Panfleto-A4.webp';

// Poster image — frame final do video (abstracto estilizado)
const POSTER_URL =
  'https://readdy.ai/api/search-image?query=Clean%20minimalist%20dark%20background%20with%20electric%20green%20and%20lime%20accent%20geometric%20lines%20forming%20a%20stylized%20motorcycle%20silhouette%20in%20the%20center%20bottom%20area%2C%20subtle%20circuit%20board%20traces%20pattern%20fading%20at%20edges%2C%20modern%20tech%20aesthetic%2C%20high%20contrast%2C%20no%20text%2C%20dark%20mood%2C%20professional%20commercial%20quality&width=1080&height=1920&seq=pjmotors-poster-v3&orientation=portrait';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

function getDeviceType(): DeviceType {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getVideoSrc(device: DeviceType): string {
  if (device === 'mobile') {
    const ratio = window.innerWidth / window.innerHeight;
    if (ratio <= 0.46) return VIDEOS.mobileTall;
    if (ratio <= 0.52) return VIDEOS.mobileMedium;
    return VIDEOS.mobileFallback;
  }
  if (device === 'tablet') return VIDEOS.tablet;
  return VIDEOS.desktop;
}

function getPauseTime(device: DeviceType): number {
  return device === 'mobile' ? 9 : 10;
}

// ============================================================
// Detecta qualidade da conexao (Network Information API)
// ============================================================
function getEffectiveConnectionType(): string {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  };
  return nav.connection?.effectiveType || '4g';
}

function isSlowConnection(): boolean {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  };
  const type = nav.connection?.effectiveType || '4g';
  const saveData = nav.connection?.saveData || false;
  return type === 'slow-2g' || type === '2g' || type === '3g' || saveData;
}

// ============================================================
// Componente Home
// ============================================================
export default function Home() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [started, setStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);

  const [device, setDevice] = useState<DeviceType>(getDeviceType);

  const videoRef = useRef<HTMLVideoElement>(null);

  // ----------------------------------------------------------
  // Detecta dispositivo no resize
  // ----------------------------------------------------------
  useEffect(() => {
    const onResize = () => {
      setDevice(getDeviceType());
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ----------------------------------------------------------
  // Tracking: page_view ao carregar a pagina (antes do modal)
  // Captura TODOS que acessam o link da campanha.
  // trackKeepalive: envio IMEDIATO — nenhum visitante passa
  // despercebido mesmo se fechar a pagina em <2 segundos.
  // ----------------------------------------------------------
  useEffect(() => {
    trackKeepalive('page_view');
    metaPixelPageView();
  }, []);

  const videoSrc = getVideoSrc(device);
  const pauseTime = getPauseTime(device);

  // ----------------------------------------------------------
  // Navegacao manual com tracking garantido ANTES do redirect
  // sendBeacon no trackKeepalive assegura que o evento nao se
  // perde na transicao entre paginas
  // ----------------------------------------------------------
  const handleNavigate = useCallback((path: string, eventType: string, eventData?: Record<string, unknown>) => {
    trackKeepalive(eventType, eventData || {});
    if (path === '/simulacao') {
      metaPixel('ViewContent', { content_name: 'Simulação', content_category: 'Funnel' });
    } else if (path === '/catalogo') {
      metaPixel('ViewContent', { content_name: 'Catálogo', content_category: 'Funnel' });
    }
    navigate(path);
  }, [navigate]);

  // ----------------------------------------------------------
  // Inicia quando clica no modal
  // ----------------------------------------------------------
  const handleStart = useCallback(() => {
    track('started_session');
    metaPixel('ViewContent', { content_name: 'Home Video', content_category: 'Landing Page' });
    setShowModal(false);
    setStarted(true);
    setVideoLoading(true);
  }, []);

  // ----------------------------------------------------------
  // Pausa no frame final
  // ----------------------------------------------------------
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= pauseTime) {
      v.pause();
      v.currentTime = pauseTime;
      setIsPaused(true);
    }
  }, [pauseTime]);

  // ----------------------------------------------------------
  // Da play COM SOM assim que o video element monta
  // ----------------------------------------------------------
  useEffect(() => {
    if (!started) return;
    const v = videoRef.current;
    if (!v) return;

    // CRÍTICO: iOS Safari só permite autoplay com muted.
    // Começamos muted, damos play, e DEPOIS tentamos ativar o som.
    // Isso garante que o vídeo toca em QUALQUER dispositivo.
    v.muted = true;
    v.volume = 0;

    let cancelled = false;

    const tryUnmute = () => {
      if (cancelled) return;
      // Tenta ativar o som após o play ter iniciado.
      // Em desktop/navegadores modernos, isso funciona porque
      // o clique no botão "Iniciar" conta como user gesture.
      v.muted = false;
      v.volume = 1;
      // Se o browser rejeitar, o vídeo continua tocando (muted)
      // e mostramos um ícone de som pro usuário ativar manualmente
      setTimeout(() => {
        if (!cancelled) {
          // muted continua true se o browser bloqueou
          setVideoMuted(v.muted);
        }
      }, 300);
    };

    const play = () => {
      if (cancelled) return;
      v.play()
        .then(() => {
          if (!cancelled) tryUnmute();
        })
        .catch(() => {
          // Fallback absoluto: se até muted falhar (raro),
          // não travamos a UI
        });
    };

    if (v.readyState >= 2) {
      play();
    } else {
      v.addEventListener('canplay', play, { once: true });
    }

    return () => {
      cancelled = true;
      v.removeEventListener('canplay', play);
    };
  }, [started, videoSrc]);

  // ----------------------------------------------------------
  // Posicoes dos botoes mapeadas do video — areas AMPLAS
  // Cobrem toda a area visual dos botoes + margem de seguranca
  // ----------------------------------------------------------
  const btnPositions = {
    mobile: {
      simulacao: { left: '2%', width: '96%', top: '40%', height: '13%' },
      catalogo: { left: '2%', width: '96%', top: '54%', height: '13%' },
    },
    tablet: {
      simulacao: { left: '15%', width: '70%', top: '38%', height: '14%' },
      catalogo: { left: '15%', width: '70%', top: '54%', height: '14%' },
    },
    desktop: {
      simulacao: { left: '20%', width: '60%', top: '36%', height: '16%' },
      catalogo: { left: '20%', width: '60%', top: '54%', height: '16%' },
    },
  };

  const pos = btnPositions[device];

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-black">
      {/* =======================================================
          Video — SO aparece depois de clicar em Iniciar
         ======================================================= */}
      {started && (
        <>
          {/* Loading overlay — aparece enquanto o video carrega */}
          {videoLoading && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black gap-4 transition-opacity duration-500">
              <div className="w-12 h-12 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm text-foreground-600">
                {isSlowConnection() ? 'Carregando vídeo... Internet mais lenta detectada' : 'Carregando vídeo...'}
              </p>
            </div>
          )}

          <video
            ref={videoRef}
            key={videoSrc}
            className={`absolute inset-0 w-full h-full object-center ${
              device === 'mobile' ? 'object-fill' : 'object-cover'
            }`}
            autoPlay
            playsInline
            preload="auto"
            muted
            poster={POSTER_URL}
            onTimeUpdate={handleTimeUpdate}
            onCanPlay={() => setVideoLoading(false)}
            onLoadedData={() => setVideoLoading(false)}
            onError={() => setVideoLoading(false)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {/* Botão de som — aparece se o vídeo tocou muted (iOS Safari) */}
          {isPaused && videoMuted && (
            <button
              onClick={() => {
                const v = videoRef.current;
                if (v) {
                  v.muted = false;
                  v.volume = 1;
                  setVideoMuted(false);
                }
              }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 text-sm font-medium cursor-pointer hover:bg-black/80 hover:text-white transition-all duration-300 whitespace-nowrap"
            >
              <i className="ri-volume-up-line text-lg" />
              Ativar som
            </button>
          )}
        </>
      )}

      {/* =======================================================
          Areas clicaveis SOBRE o video congelado
          Cada botao ocupa 100% da sua area definida
         ======================================================= */}
      {started && (
        <div
          className={`absolute inset-0 z-20 transition-opacity duration-700 ease-out ${
            isPaused
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <a
            href="/simulacao"
            onClick={(e) => { e.preventDefault(); handleNavigate('/simulacao', 'clicked_simulacao'); }}
            className="absolute block cursor-pointer"
            style={{
              left: pos.simulacao.left,
              width: pos.simulacao.width,
              top: pos.simulacao.top,
              height: pos.simulacao.height,
            }}
            aria-label="Fazer simulacao"
          />
          <a
            href="/catalogo"
            onClick={(e) => { e.preventDefault(); handleNavigate('/catalogo', 'clicked_catalogo'); }}
            className="absolute block cursor-pointer"
            style={{
              left: pos.catalogo.left,
              width: pos.catalogo.width,
              top: pos.catalogo.top,
              height: pos.catalogo.height,
            }}
            aria-label="Ver catalogo"
          />
        </div>
      )}

      {/* =======================================================
          MODAL DE BOAS-VINDAS
         ======================================================= */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 gap-2">
          {/* Logo PJ MOTORS — GRANDE e evidente em todos dispositivos */}
          <div
            className="flex items-center justify-center flex-shrink-0
              w-[90vw] h-[90vw] min-w-[280px] min-h-[280px] max-h-[55dvh]
              md:w-auto md:h-[48dvh] md:min-h-[280px] md:max-h-[520px]
              lg:max-h-[550px]
              drop-shadow-[0_0_100px_rgba(255,255,255,0.35)]"
          >
            {!logoError ? (
              <img
                src={LOGO_URL}
                alt="PJ Motors"
                loading="eager"
                fetchPriority="high"
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-neutral-900 rounded-lg">
                <span className="text-foreground-50 text-xl md:text-3xl font-bold tracking-wider">
                  PJ MOTORS
                </span>
              </div>
            )}
          </div>

          {/* Texto */}
          <p className="text-base text-neutral-400 leading-relaxed text-center mt-1">
            Bem-vindo a PJ Motors
          </p>

          {/* Botao */}
          <button
            onClick={handleStart}
            className="group relative px-10 py-3 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm font-semibold tracking-wide uppercase cursor-pointer transition-all duration-300 hover:bg-neutral-700 hover:border-neutral-500 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)] active:scale-95 whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <i className="ri-play-circle-line text-lg" />
              Conheça nossos Produtos
            </span>
          </button>
        </div>
      )}
    </main>
  );
}