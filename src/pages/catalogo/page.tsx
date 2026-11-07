import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { linhaCima, linhaBaixo } from '@/mocks/catalogo';
import { track, trackKeepalive } from '@/utils/tracker';
import { metaPixelPageView, metaPixel } from '@/utils/metaPixel';
import ProductCarousel from './components/ProductCarousel';
import VideoModal from './components/VideoModal';

const HERO_BG = 'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/526fb598-54e3-4040-b80c-509feacb9fab_compressed_2.webp';

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const modoRedirecionado = searchParams.get('modo') === 'aprovado';
  const perfilLabel = searchParams.get('perfil') || '';
  const userData = modoRedirecionado
    ? {
        nome: searchParams.get('nome') || '',
        cpf: searchParams.get('cpf') || '',
        cidade: searchParams.get('cidade') || '',
        whatsapp: searchParams.get('whatsapp') || '',
        endereco: searchParams.get('endereco') || '',
        cep: searchParams.get('cep') || '',
        dataNascimento: searchParams.get('dataNascimento') || '',
      }
    : undefined;

  const [scrolled, setScrolled] = useState(false);
  const [videoModal, setVideoModal] = useState<{ url: string; isVertical: boolean } | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (modoRedirecionado && userData) {
      trackKeepalive('viewed_catalogo_aprovado', {
        nome: userData.nome,
        cpf: userData.cpf,
        cidade: userData.cidade,
        whatsapp: userData.whatsapp,
        perfil: perfilLabel,
      });
      metaPixel('ViewContent', {
        content_name: 'Catálogo Aprovado',
        content_category: 'Funnel',
        status: 'aprovado',
      });
    } else {
      trackKeepalive('viewed_catalogo');
      metaPixel('ViewContent', {
        content_name: 'Catálogo',
        content_category: 'Funnel',
      });
    }
  }, []);

  // Tracking: page_view para catalogar TODAS as visitas a esta pagina
  useEffect(() => {
    trackKeepalive('page_view');
    metaPixelPageView();
  }, []);

  const handleOpenVideo = (videoUrl: string, isVertical: boolean) => {
    setVideoModal({ url: videoUrl, isVertical });
  };

  const handleCloseVideo = () => {
    setVideoModal(null);
  };

  return (
    <main className="min-h-screen w-full bg-background-950">
      {/* ========================================
          NAVBAR FIXA AO ROLAR
         ======================================== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-background-950/95 backdrop-blur-md border-b border-background-800/50 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg md:text-xl font-bold text-foreground-50 tracking-wide">
            PJ MOTORS
          </Link>
          <div className="flex items-center gap-3 md:gap-4">
          </div>
        </div>
      </nav>

      {/* ========================================
          HERO — Apenas paisagem urbana
         ======================================== */}
      <section className="relative w-full min-h-[420px] md:min-h-[540px] overflow-hidden">
        {/* Background: paisagem urbana */}
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt="Paisagem urbana"
            fetchPriority="high"
            loading="eager"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradiente escuro para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        {/* Texto central */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 min-h-[420px] md:min-h-[540px]">
          <p className="text-[10px] md:text-xs font-medium text-primary-400 uppercase tracking-[0.3em] mb-3 md:mb-4">
            {modoRedirecionado ? 'Financiamento Aprovado' : 'Nova Coleção 2026'}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
            PJ MOTORS
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-white/80 max-w-lg leading-relaxed">
            {modoRedirecionado
              ? 'Parabéns! Agora é só escolher sua moto e finalizar a compra.'
              : 'Motos elétricas sem entrada. Entrega rápida. Financiamento facilitado.'}
          </p>

          {/* Badge promocional */}
          {!modoRedirecionado && (
            <div className="mt-5 md:mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
              <i className="ri-flashlight-fill text-primary-400 text-sm" />
              <span className="text-xs md:text-sm text-white/90 font-medium">
                Sem entrada • Aprovação em minutos
              </span>
            </div>
          )}

          {modoRedirecionado && (
            <div className="mt-5 md:mt-6 inline-flex items-center gap-2 bg-primary-500/15 backdrop-blur-md border border-primary-500/30 rounded-full px-4 py-2">
              <i className="ri-shield-check-line text-primary-400 text-sm" />
              <span className="text-xs md:text-sm text-primary-300 font-medium">
                Crédito aprovado — escolha seu modelo
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ========================================
          CATÁLOGO — 2 linhas de carrossel
         ======================================== */}
      <section className="relative z-30 w-full max-w-5xl mx-auto px-4 md:px-6 py-10 md:py-16 -mt-6">
        {/* Faixa decorativa */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-primary-500/40 rounded-full" />

        {/* Linha de cima — 7 mais caras */}
        <div className="mb-10 md:mb-14">
          <ProductCarousel
            produtos={linhaCima}
            titulo={modoRedirecionado ? 'Escolha seu modelo' : 'Linha Premium'}
            modoRedirecionado={modoRedirecionado}
            perfilLabel={perfilLabel}
            userData={userData}
            videoAberto={videoModal !== null}
            onOpenVideo={handleOpenVideo}
          />
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-4 mb-10 md:mb-14">
          <div className="flex-1 h-px bg-background-800/60" />
          <span className="text-[10px] md:text-xs font-medium text-foreground-600 uppercase tracking-widest">
            {modoRedirecionado ? 'Mais opções' : 'Linha Econômica'}
          </span>
          <div className="flex-1 h-px bg-background-800/60" />
        </div>

        {/* Linha de baixo — 6 mais baratas */}
        <div>
          <ProductCarousel
            produtos={linhaBaixo}
            titulo={modoRedirecionado ? 'Alternativas' : 'Entrada Acessível'}
            modoRedirecionado={modoRedirecionado}
            perfilLabel={perfilLabel}
            userData={userData}
            videoAberto={videoModal !== null}
            onOpenVideo={handleOpenVideo}
          />
        </div>
      </section>

      {videoModal && (
        <VideoModal
          videoUrl={videoModal.url}
          isVertical={videoModal.isVertical}
          onClose={handleCloseVideo}
        />
      )}
    </main>
  );
}