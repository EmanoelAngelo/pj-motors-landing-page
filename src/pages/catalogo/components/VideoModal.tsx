import { useRef, useEffect, useCallback, useState } from 'react';

interface VideoModalProps {
  videoUrl: string;
  onClose: () => void;
  isVertical?: boolean;
}

function extrairVideoId(url: string): string | null {
  const match = url.match(/(?:embed\/|watch\?v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: Record<string, () => void>;
        },
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

interface YTPlayer {
  destroy: () => void;
  setPlaybackQuality: (quality: string) => void;
  getAvailableQualityLevels: () => string[];
  getPlayerState: () => number;
}

// Singleton: carrega YouTube API uma única vez, sob demanda
let ytApiPromise: Promise<void> | null = null;

function carregarYouTubeApi(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    // Define callback ANTES de injetar o script
    const callbackOriginal = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (callbackOriginal) callbackOriginal();
      resolve();
    };

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(tag, firstScript);
  });

  return ytApiPromise;
}

export default function VideoModal({ videoUrl, onClose, isVertical = false }: VideoModalProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerId = useRef(`yt-player-${Date.now()}`);
  const [apiPronta, setApiPronta] = useState(false);
  const [playerPronto, setPlayerPronto] = useState(false);

  const isShort = isVertical || videoUrl.includes('/shorts/');
  const videoId = extrairVideoId(videoUrl);

  const forcarHD = useCallback((player: YTPlayer) => {
    try {
      const available = player.getAvailableQualityLevels();
      // Ordem de preferência: 1440p, 1080p, 720p, 480p, melhor disponível
      const preferencias = ['hd1440', 'hd1080', 'hd720', 'large'];
      let escolhida: string | null = null;

      for (const q of preferencias) {
        if (available.includes(q)) {
          escolhida = q;
          break;
        }
      }
      if (!escolhida && available.length > 0) {
        escolhida = available[0];
      }

      if (escolhida) {
        player.setPlaybackQuality(escolhida);
      }
    } catch {
      // Silencioso — o player pode não suportar ainda
    }
  }, []);

  useEffect(() => {
    if (!videoId) return;

    let cancelled = false;
    let tentativas = 0;
    const maxTentativas = 30;

    const initPlayer = () => {
      if (cancelled) return;

      if (!window.YT || !window.YT.Player) {
        tentativas++;
        if (tentativas < maxTentativas) {
          setTimeout(initPlayer, 200);
        }
        return;
      }

      if (!cancelled) setApiPronta(true);

      const el = document.getElementById(playerId.current);
      if (!el) return;

      playerRef.current = new window.YT.Player(playerId.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          playsinline: 1,
          hd: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setPlayerPronto(true);
            if (playerRef.current) {
              setTimeout(() => forcarHD(playerRef.current!), 2500);
              intervalRef.current = setInterval(() => {
                if (playerRef.current) {
                  forcarHD(playerRef.current);
                }
              }, 2000);
              setTimeout(() => {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
              }, 12000);
            }
          },
          onStateChange: () => {
            if (playerRef.current && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
              setTimeout(() => forcarHD(playerRef.current!), 500);
            }
          },
        },
      });
    };

    // Carrega API sob demanda primeiro, depois inicia player
    carregarYouTubeApi().then(() => {
      if (!cancelled) initPlayer();
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignora erros de cleanup
        }
        playerRef.current = null;
      }
    };
  }, [videoId, forcarHD]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-0 md:px-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full h-full md:h-auto md:w-full flex flex-col items-center justify-center animate-fade-in-up ${
          isShort ? 'max-w-none' : 'max-w-5xl'
        }`}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between px-4 md:px-0 mb-2 md:mb-3">
          <h3 className="font-heading text-lg font-semibold text-foreground-50">Vídeo do Produto</h3>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-background-800 text-foreground-400 hover:text-foreground-200 transition-colors"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Player container */}
        <div
          ref={containerRef}
          className={`relative overflow-hidden bg-black ${
            isShort
              ? 'w-full h-[calc(100vh-80px)] md:h-[85vh] md:w-auto md:aspect-[9/16] rounded-xl'
              : 'w-full aspect-video rounded-xl border border-background-700/50'
          }`}
        >
          {/* Loading spinner — aparece enquanto a API do YouTube carrega */}
          {!playerPronto && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black gap-4">
              <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-xs text-foreground-600">
                {!apiPronta ? 'Preparando player...' : 'Carregando vídeo...'}
              </p>
            </div>
          )}
          <div id={playerId.current} className="absolute inset-0 w-full h-full" />
        </div>
      </div>
    </div>
  );
}