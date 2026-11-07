import { useState, useCallback, useEffect, useRef } from 'react';
import type { Moto } from '@/mocks/catalogo';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  produtos: Moto[];
  titulo: string;
  modoRedirecionado: boolean;
  perfilLabel?: string;
  userData?: { nome: string; cpf: string; cidade: string; whatsapp: string; endereco?: string; cep?: string; dataNascimento?: string };
  videoAberto?: boolean;
  onOpenVideo?: (videoUrl: string, isVertical: boolean) => void;
}

interface AnimState {
  type: 'next' | 'prev';
  exitCard: Moto;
  shiftCard: Moto;
  enterCard: Moto;
  animKey: number;
}

function useCardsPerPage() {
  const [cardsPerPage, setCardsPerPage] = useState(2);

  useEffect(() => {
    const update = () => {
      setCardsPerPage(window.innerWidth < 768 ? 1 : 2);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return cardsPerPage;
}

export default function ProductCarousel({
  produtos,
  titulo,
  modoRedirecionado,
  perfilLabel = '',
  userData,
  videoAberto = false,
  onOpenVideo,
}: ProductCarouselProps) {
  const [indice, setIndice] = useState(0);
  const [animState, setAnimState] = useState<AnimState | null>(null);
  const [animando, setAnimando] = useState(false);
  const animKeyRef = useRef(0);
  const cardsPerPage = useCardsPerPage();
  const isDesktop = cardsPerPage === 2;

  // Touch swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const maxIndice = Math.max(0, produtos.length - cardsPerPage);
  const podeVoltar = indice > 0;
  const podeAvancar = indice < maxIndice;

  const visiveis = produtos.slice(indice, indice + cardsPerPage);
  while (visiveis.length < cardsPerPage) {
    visiveis.push(produtos[produtos.length - 1]);
  }

  const navegar = useCallback(
    (sentido: 'prev' | 'next') => {
      if (animando) return;
      if (sentido === 'prev' && !podeVoltar) return;
      if (sentido === 'next' && !podeAvancar) return;

      setAnimando(true);
      animKeyRef.current += 1;

      if (sentido === 'next') {
        setAnimState({
          type: 'next',
          exitCard: visiveis[0],
          shiftCard: visiveis[1],
          enterCard: produtos[indice + cardsPerPage],
          animKey: animKeyRef.current,
        });
      } else {
        setAnimState({
          type: 'prev',
          exitCard: visiveis[1],
          shiftCard: visiveis[0],
          enterCard: produtos[indice - 1],
          animKey: animKeyRef.current,
        });
      }
    },
    [animando, podeVoltar, podeAvancar, visiveis, produtos, indice, cardsPerPage],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          navegar('prev');
        } else {
          navegar('next');
        }
      }
    },
    [navegar],
  );

  // Limpa animState após a animação terminar
  useEffect(() => {
    if (!animState) return;
    const timer = setTimeout(() => {
      if (animState.type === 'next') {
        setIndice((prev) => Math.min(prev + 1, maxIndice));
      } else {
        setIndice((prev) => Math.max(prev - 1, 0));
      }
      setAnimState(null);
      setAnimando(false);
    }, 420);
    return () => clearTimeout(timer);
  }, [animState, maxIndice]);

  return (
    <div className="w-full">
      {/* Título da linha */}
      <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
        <h2 className="font-heading text-lg md:text-xl font-semibold text-foreground-200 tracking-wide">
          {titulo}
        </h2>
        <div className="flex items-center gap-3">
          {/* Seta esquerda no header */}
          {!videoAberto && (
            <button
              onClick={() => navegar('prev')}
              disabled={!podeVoltar || animando}
              className={`flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap
                w-8 h-8
                ${
                  podeVoltar
                    ? 'bg-background-800/80 border border-background-600 text-foreground-300 hover:bg-background-700 hover:border-primary-500/60 hover:text-primary-400'
                    : 'bg-background-900/40 border border-background-800 text-foreground-700 cursor-not-allowed opacity-30 pointer-events-none'
                }`}
              aria-label="Anterior"
            >
              <i className="ri-arrow-left-s-line text-lg" />
            </button>
          )}

          <span className="text-xs text-foreground-600 whitespace-nowrap">
            {cardsPerPage === 1
              ? `${Math.min(indice + 1, produtos.length)} de ${produtos.length}`
              : `${indice + 1}–${Math.min(indice + cardsPerPage, produtos.length)} de ${produtos.length}`}
          </span>

          {/* Seta direita no header */}
          {!videoAberto && (
            <button
              onClick={() => navegar('next')}
              disabled={!podeAvancar || animando}
              className={`flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap
                w-8 h-8
                ${
                  podeAvancar
                    ? 'bg-background-800/80 border border-background-600 text-foreground-300 hover:bg-background-700 hover:border-primary-500/60 hover:text-primary-400'
                    : 'bg-background-900/40 border border-background-800 text-foreground-700 cursor-not-allowed opacity-30 pointer-events-none'
                }`}
              aria-label="Próximo"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          )}
        </div>
      </div>

      {/* Container do carrossel */}
      <div
        className="relative flex items-stretch"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {animState && isDesktop ? (
          /* ============================================
             MODO ANIMAÇÃO — TINDER-LIKE (desktop 2 cards)
             ============================================ */
          <div
            key={animState.animKey}
            className="relative w-full overflow-hidden"
            style={{ minHeight: '520px' }}
          >
            {/* Card saindo */}
            <div
              className={`absolute top-0 w-[calc(50%-8px)] ${
                animState.type === 'next'
                  ? 'carousel-card-exit-left'
                  : 'carousel-card-exit-right'
              }`}
            >
              <ProductCard
                moto={animState.exitCard}
                modoRedirecionado={modoRedirecionado}
                perfilLabel={perfilLabel}
                userData={userData}
                onOpenVideo={onOpenVideo}
              />
            </div>

            {/* Card trocando de posição */}
            <div
              className={`absolute top-0 w-[calc(50%-8px)] ${
                animState.type === 'next'
                  ? 'carousel-card-shift-left'
                  : 'carousel-card-shift-right'
              }`}
            >
              <ProductCard
                moto={animState.shiftCard}
                modoRedirecionado={modoRedirecionado}
                perfilLabel={perfilLabel}
                userData={userData}
                onOpenVideo={onOpenVideo}
              />
            </div>

            {/* Novo card entrando */}
            <div
              className={`absolute top-0 w-[calc(50%-8px)] ${
                animState.type === 'next'
                  ? 'carousel-card-enter-right'
                  : 'carousel-card-enter-left'
              }`}
            >
              <ProductCard
                moto={animState.enterCard}
                modoRedirecionado={modoRedirecionado}
                perfilLabel={perfilLabel}
                userData={userData}
                onOpenVideo={onOpenVideo}
              />
            </div>
          </div>
        ) : (
          /* ============================================
             MODO ESTÁTICO — grid normal
             ============================================ */
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {visiveis.map((moto) => (
                <ProductCard
                  key={moto.id}
                  moto={moto}
                  modoRedirecionado={modoRedirecionado}
                  perfilLabel={perfilLabel}
                  userData={userData}
                  onOpenVideo={onOpenVideo}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}