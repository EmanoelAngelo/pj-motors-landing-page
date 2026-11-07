import { useState } from 'react';
import type { Moto } from '@/mocks/catalogo';
import { WPP_NUMERO, montarMensagemWhatsAppV2 } from '@/mocks/catalogo';
import { formatCpf, validateCpf } from '@/utils/cpf';
import { track } from '@/utils/tracker';
import { metaPixel, metaPixelCustom } from '@/utils/metaPixel';

interface CompraModalProps {
  moto: Moto;
  onClose: () => void;
  tipo: 'compra' | 'financiado';
  perfilLabel?: string;
  userData?: { nome: string; cpf: string; cidade: string; whatsapp: string; endereco?: string; cep?: string; dataNascimento?: string };
}

const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express', 'Outra'];
const PARCELAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export default function CompraModal({ moto, onClose, tipo, perfilLabel = '', userData }: CompraModalProps) {
  // Forma de pagamento
  const [formaPagamento, setFormaPagamento] = useState<'avista' | 'cartao' | null>(
    tipo === 'financiado' ? null : null,
  );

  // Dados cartão
  const [bandeira, setBandeira] = useState('');
  const [parcelas, setParcelas] = useState<number | null>(null);

  // Dados pessoais — pré-preenchidos se vier da simulação
  const [nome, setNome] = useState(userData?.nome || '');
  const [cpf, setCpf] = useState(userData?.cpf || '');
  const [cidade, setCidade] = useState(userData?.cidade || '');
  const [whatsapp, setWhatsapp] = useState(userData?.whatsapp || '');
  const [endereco, setEndereco] = useState(userData?.endereco || '');
  const [cep, setCep] = useState(userData?.cep || '');
  const [dataNascimento, setDataNascimento] = useState(userData?.dataNascimento || '');

  const [enviado, setEnviado] = useState(false);

  const cpfValido = validateCpf(cpf);
  const cpfCheio = cpf.replace(/\D/g, '').length === 11;

  const podeEnviar = (() => {
    if (tipo === 'financiado') {
      return (
        nome.trim().length >= 2 &&
        cpfValido &&
        cidade.trim().length >= 2 &&
        whatsapp.replace(/\D/g, '').length >= 11
      );
    }
    if (formaPagamento === 'avista') {
      return (
        nome.trim().length >= 2 &&
        cpfValido &&
        cidade.trim().length >= 2 &&
        whatsapp.replace(/\D/g, '').length >= 11
      );
    }
    if (formaPagamento === 'cartao') {
      return (
        bandeira &&
        parcelas &&
        nome.trim().length >= 2 &&
        cpfValido &&
        cidade.trim().length >= 2 &&
        whatsapp.replace(/\D/g, '').length >= 11
      );
    }
    return false;
  })();

  const formatarWhats = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  };

  const handleEnviar = () => {
    if (!podeEnviar) return;

    let tipoEnvio: 'avista' | 'financiado' | 'cartao' = 'avista';
    if (tipo === 'financiado') tipoEnvio = 'financiado';
    else if (formaPagamento === 'cartao') tipoEnvio = 'cartao';

    track('compra_enviada', {
      modelo: moto.nome,
      preco: moto.preco,
      tipo: tipoEnvio,
      nome,
      cpf,
      cidade,
      whatsapp,
      perfil: perfilLabel,
      endereco,
      cep,
      dataNascimento,
      bandeira: formaPagamento === 'cartao' ? bandeira : undefined,
      parcelas: formaPagamento === 'cartao' ? parcelas : undefined,
    });

    metaPixel('Purchase', {
      content_ids: [moto.id],
      content_name: moto.nome,
      content_type: 'product',
      value: moto.precoNum,
      currency: 'BRL',
      tipo: tipoEnvio,
      parcelas: formaPagamento === 'cartao' ? parcelas : undefined,
    });
    metaPixel('Contact', {
      content_name: 'WhatsApp Pedido',
      content_category: 'Funnel',
      tipo: tipoEnvio,
    });

    const msg = montarMensagemWhatsAppV2(
      nome,
      cpf,
      cidade,
      whatsapp,
      perfilLabel,
      moto,
      tipoEnvio,
      formaPagamento === 'cartao' ? bandeira : undefined,
      formaPagamento === 'cartao' ? parcelas : undefined,
      endereco,
      cep,
      dataNascimento,
    );
    window.open(`https://wa.me/${WPP_NUMERO}?text=${msg}`, '_blank');
    setEnviado(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background-900 border border-background-700/50 rounded-2xl p-5 md:p-8 max-h-[90vh] overflow-y-auto">
        {!enviado ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-heading text-lg md:text-xl font-bold text-foreground-50">
                  {userData ? 'Confirme seu pedido' : tipo === 'financiado' ? 'Comprar Financiado' : 'Comprar'}
                </h3>
                <p className="text-sm text-foreground-400 mt-1">
                  {moto.nome}{tipo !== 'financiado' ? ` — ${moto.preco}` : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-background-800 text-foreground-400 hover:text-foreground-200 transition-colors flex-shrink-0"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Card de resumo do produto + dados (quando veio da simulação) */}
            {userData && (
              <div className="bg-background-800/40 border border-background-700/40 rounded-xl p-4 mb-5 animate-fade-in">
                <p className="text-xs font-medium text-foreground-500 uppercase tracking-wider mb-3">
                  Resumo do pedido
                </p>
                <div className="flex items-start gap-4">
                  <img
                    src={moto.imagem}
                    alt={moto.nome}
                    className="w-20 h-20 rounded-lg object-contain bg-white flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-base font-semibold text-foreground-100">{moto.nome}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-foreground-400">
                      <span><i className="ri-flashlight-line mr-1" />{moto.potencia}</span>
                      <span><i className="ri-speed-line mr-1" />{moto.velocidade}</span>
                      <span><i className="ri-route-line mr-1" />{moto.autonomia}</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      {tipo !== 'financiado' && (
                        <>
                          <span className="text-lg font-bold text-primary-400">{moto.preco}</span>
                          <span className="text-xs text-foreground-500">{moto.precoParcela}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-accent-500/15 border border-accent-500/30 rounded-full px-3 py-0.5">
                      <i className="ri-bank-card-line text-accent-400 text-xs" />
                      <span className="text-xs font-medium text-accent-300">Financiado</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* PASSO 1: Forma de pagamento (só quando não é financiado) */}
              {tipo !== 'financiado' && (
                <div>
                  <label className="block text-xs font-medium text-foreground-500 uppercase tracking-wider mb-2">
                    Forma de pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormaPagamento('avista');
                        setBandeira('');
                        setParcelas(null);
                      }}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                        formaPagamento === 'avista'
                          ? 'bg-primary-500/15 border-primary-500/60 text-primary-400'
                          : 'bg-background-950 border-background-700/50 text-foreground-500 hover:border-background-600'
                      }`}
                    >
                      <i className="ri-money-cny-circle-line mr-1.5" />
                      À Vista
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('cartao')}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                        formaPagamento === 'cartao'
                          ? 'bg-primary-500/15 border-primary-500/60 text-primary-400'
                          : 'bg-background-950 border-background-700/50 text-foreground-500 hover:border-background-600'
                      }`}
                    >
                      <i className="ri-bank-card-line mr-1.5" />
                      Cartão
                    </button>
                  </div>
                </div>
              )}

              {/* PASSO 2: Dados do cartão */}
              {formaPagamento === 'cartao' && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-foreground-500 uppercase tracking-wider mb-1.5">
                      Bandeira do cartão
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {BANDEIRAS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBandeira(b)}
                          className={`py-2 px-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                            bandeira === b
                              ? 'bg-accent-500/15 border-accent-500/60 text-accent-400'
                              : 'bg-background-950 border-background-700/50 text-foreground-500 hover:border-background-600'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-500 uppercase tracking-wider mb-1.5">
                      Parcelas
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {PARCELAS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setParcelas(p)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
                            parcelas === p
                              ? 'bg-accent-500/15 border-accent-500/60 text-accent-400'
                              : 'bg-background-950 border-background-700/50 text-foreground-500 hover:border-background-600'
                          }`}
                        >
                          {p}x
                        </button>
                      ))}
                    </div>                  </div>
                </div>
              )}

              {/* PASSO 3: Dados pessoais */}
              {(formaPagamento || tipo === 'financiado') && (
                <div className="space-y-3 pt-2 border-t border-background-700/30 animate-fade-in">
                  <p className="text-xs font-medium text-foreground-500 uppercase tracking-wider">
                    {userData ? 'Confirme seus dados' : 'Seus dados'}
                  </p>

                  <div>
                    <label className="block text-xs font-medium text-foreground-500 uppercase tracking-wider mb-1.5">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Digite seu nome"
                      className="w-full bg-background-950 border border-background-700/50 rounded-xl px-4 py-3 text-foreground-100 placeholder-foreground-700 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-500 uppercase tracking-wider mb-1.5">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`w-full bg-background-950 border rounded-xl px-4 py-3 text-foreground-100 placeholder-foreground-700 focus:outline-none focus:ring-1 transition-all text-sm ${
                        cpfCheio && cpfValido
                          ? 'border-primary-500/50 focus:border-primary-500/80 focus:ring-primary-500/20'
                          : cpfCheio && !cpfValido
                            ? 'border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20'
                            : 'border-background-700/50 focus:border-primary-500/60 focus:ring-primary-500/20'
                      }`}
                    />
                    {cpfCheio && !cpfValido && (
                      <p className="mt-1 text-xs text-red-400">CPF inválido</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-500 uppercase tracking-wider mb-1.5">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Digite sua cidade"
                      className="w-full bg-background-950 border border-background-700/50 rounded-xl px-4 py-3 text-foreground-100 placeholder-foreground-700 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground-500 uppercase tracking-wider mb-1.5">
                      WhatsApp
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-600">
                        <i className="ri-whatsapp-line text-lg" />
                      </div>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(formatarWhats(e.target.value))}
                        placeholder="(00) 00000-0000"
                        className="w-full bg-background-950 border border-background-700/50 rounded-xl pl-11 pr-4 py-3 text-foreground-100 placeholder-foreground-700 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Honeypot */}
              <div className="hp-field-wrap">
                <input
                  type="text"
                  name="website_alt"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  readOnly
                />
              </div>

              {(formaPagamento || tipo === 'financiado') && (
                <button
                  onClick={handleEnviar}
                  disabled={!podeEnviar}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    podeEnviar
                      ? 'bg-primary-500 hover:bg-primary-600 text-foreground-50'
                      : 'bg-background-800 text-foreground-600 cursor-not-allowed'
                  }`}
                >
                  <i className="ri-whatsapp-line mr-2" />
                  {userData ? 'Confirmar e enviar pedido' : 'Enviar pedido pelo WhatsApp'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-primary-500/15 text-primary-400 border border-primary-500/30">
              <i className="ri-check-line text-3xl" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground-50">Pedido enviado!</h3>
            <p className="mt-2 text-sm text-foreground-400">
              Seus dados foram enviados para a PJ Motors. Em breve entrarão em contato pelo WhatsApp.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-8 py-2.5 rounded-xl bg-background-800 text-foreground-300 hover:text-foreground-100 text-sm font-medium cursor-pointer transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}