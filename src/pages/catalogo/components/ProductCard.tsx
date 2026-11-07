import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Moto } from '@/mocks/catalogo';
import { WPP_NUMERO, montarMensagemWhatsApp } from '@/mocks/catalogo';
import { track, trackKeepalive } from '@/utils/tracker';
import { metaPixel } from '@/utils/metaPixel';
import CompraModal from './CompraModal';

interface ProductCardProps {
  moto: Moto;
  modoRedirecionado: boolean;
  perfilLabel?: string;
  userData?: { nome: string; cpf: string; cidade: string; whatsapp: string; endereco?: string; cep?: string; dataNascimento?: string };
  onOpenVideo?: (videoUrl: string, isVertical: boolean) => void;
}

export default function ProductCard({ moto, modoRedirecionado, perfilLabel = '', userData, onOpenVideo }: ProductCardProps) {
  const navigate = useNavigate();
  const [showCompra, setShowCompra] = useState(false);
  const [compraTipo, setCompraTipo] = useState<'compra' | 'financiado'>('compra');

  const handleFinanciamento = () => {
    trackKeepalive('clicked_financiamento', { modelo: moto.nome, preco: moto.preco });
    metaPixel('InitiateCheckout', {
      content_name: 'Financiamento',
      content_category: 'Funnel',
      modelo: moto.nome,
    });
    navigate(`/simulacao?modelo=${moto.id}&preco=${moto.precoNum}&origem=catalogo`);
  };

  const handleCompraAvista = () => {
    track('clicked_comprar', { modelo: moto.nome, preco: moto.preco, tipo: 'avista' });
    metaPixel('AddToCart', {
      content_ids: [moto.id],
      content_name: moto.nome,
      content_type: 'product',
      value: moto.precoNum,
      currency: 'BRL',
    });
    setCompraTipo('compra');
    setShowCompra(true);
  };

  const handleCompraFinanciado = () => {
    track('clicked_comprar_financiado', { modelo: moto.nome, preco: moto.preco });
    metaPixel('AddToCart', {
      content_ids: [moto.id],
      content_name: moto.nome,
      content_type: 'product',
      value: moto.precoNum,
      currency: 'BRL',
      tipo: 'financiado',
    });
    setCompraTipo('financiado');
    setShowCompra(true);
  };

  return (
    <>
      <div className="group bg-background-900/70 border border-background-700/40 rounded-2xl overflow-hidden hover:border-primary-500/30 transition-all duration-300 flex flex-col">
        {/* Imagem — moto inteira, sem cortes, fundo estúdio pra integrar com as fotos */}
        <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden bg-white flex items-center justify-center p-0">
          <img
            src={moto.imagem}
            alt={moto.nome}
            title={moto.nome}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="p-4 sm:p-4 flex flex-col flex-1">
          {/* Nome + badge de destaque */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-lg sm:text-lg font-semibold text-foreground-100 leading-tight">
              {moto.nome}
            </h3>
            {moto.destaque && (
              <span className="flex-shrink-0 bg-primary-500/90 text-background-50 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {moto.destaque}
              </span>
            )}
          </div>

          {/* Specs — formato didático, tipo ficha técnica */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-background-800/40 rounded-lg px-3 py-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-primary-500/15 flex-shrink-0">
                <i className="ri-flashlight-line text-primary-400 text-xs" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-600 leading-none">Potência</span>
                <span className="text-sm font-semibold text-foreground-200 leading-tight">{moto.potencia}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background-800/40 rounded-lg px-3 py-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-accent-500/15 flex-shrink-0">
                <i className="ri-speed-line text-accent-400 text-xs" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-600 leading-none">Velocidade</span>
                <span className="text-sm font-semibold text-foreground-200 leading-tight">{moto.velocidade}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background-800/40 rounded-lg px-3 py-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-secondary-500/15 flex-shrink-0">
                <i className="ri-route-line text-secondary-400 text-xs" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-foreground-600 leading-none">Autonomia</span>
                <span className="text-sm font-semibold text-foreground-200 leading-tight">{moto.autonomia}</span>
              </div>
            </div>
          </div>

          {/* Descrição completa (quando disponível) */}
          {moto.descricao && (
            <div className="mt-3">
              <p className="text-xs sm:text-sm text-foreground-400 leading-relaxed">
                {moto.descricao}
              </p>
            </div>
          )}

          {/* Preço */}
          <div className="mt-3 sm:mt-4 pt-3 border-t border-background-700/30">
            <p className="text-2xl sm:text-2xl font-bold text-primary-400">
              {moto.preco}
            </p>
            <p className="text-xs sm:text-sm text-foreground-500 mt-1">
              {moto.precoParcela}
            </p>
            <p className="text-[10px] text-foreground-600/50 mt-0.5">
              no cartão sem juros
            </p>
          </div>

          {/* Botões */}
          <div className="mt-auto pt-3 sm:pt-4 flex flex-col gap-2">
            {/* Botão Saiba Mais — sempre visível */}
            <button
              onClick={() => {
                track('clicked_saiba_mais', { modelo: moto.nome });
                metaPixel('ViewContent', {
                  content_name: moto.nome,
                  content_category: 'Produto',
                  content_ids: [moto.id],
                  content_type: 'product',
                });
                onOpenVideo?.(moto.videoUrl, true);
              }}
              className="whitespace-nowrap cursor-pointer w-full border border-background-600 hover:border-foreground-400 text-foreground-400 hover:text-foreground-200 py-2.5 rounded-lg transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2"
            >
              <i className="ri-video-line w-4 h-4 flex items-center justify-center" />
              Saiba Mais
            </button>

            {!modoRedirecionado ? (
              <>
                {/* Botão Comprar */}
                <button
                  onClick={handleCompraAvista}
                  className="whitespace-nowrap cursor-pointer w-full bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  <i className="ri-shopping-cart-line w-4 h-4 flex items-center justify-center" />
                  Comprar
                </button>
                <button
                  onClick={handleFinanciamento}
                  className="whitespace-nowrap cursor-pointer w-full bg-accent-500 hover:bg-accent-600 text-background-50 font-semibold py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
                >
                  <i className="ri-bank-card-line w-4 h-4 flex items-center justify-center" />
                  Fazer Financiamento
                </button>
              </>
            ) : (
              /* Modo Redirecionado: Comprar Financiado */
              <button
                onClick={handleCompraFinanciado}
                className="whitespace-nowrap cursor-pointer w-full bg-accent-500 hover:bg-accent-600 text-background-50 font-semibold py-2.5 rounded-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
              >
                <i className="ri-bank-card-line w-4 h-4 flex items-center justify-center" />
                Comprar Financiado
              </button>
            )}
          </div>
        </div>
      </div>

      {showCompra && (
        <CompraModal
          moto={moto}
          tipo={compraTipo}
          perfilLabel={perfilLabel}
          userData={userData}
          onClose={() => setShowCompra(false)}
        />
      )}
    </>
  );
}