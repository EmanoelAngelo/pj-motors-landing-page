import { perfis } from '@/mocks/simulacao';
import { useEffect, useState } from 'react';
import { playClickSound, playStepSound, playSuccessSound, playErrorSound } from '@/utils/sound';
import { track } from '@/utils/tracker';

/* ========== STEP 1: NOME + CPF + ENDEREÇO + DATA NASC ========== */
interface Step1Props {
  formData: {
    nome: string;
    cpf: string;
    cep: string;
    endereco: string;
    enderecoNumero: string;
    bairro: string;
    cidadeCep: string;
    estado: string;
    dataNascimento: string;
  };
  updateForm: (key: string, value: string) => void;
  formatCpf: (value: string) => string;
  formatCep: (value: string) => string;
  formatDataNasc: (value: string) => string;
  validateCpf: (cpf: string) => boolean;
  canProceed: boolean;
  onContinue: () => void;
}

export function Step1View({
  formData,
  updateForm,
  formatCpf,
  formatCep,
  formatDataNasc,
  validateCpf,
  canProceed,
  onContinue,
}: Step1Props) {
  const cpfDigits = formData.cpf.replace(/\D/g, '');
  const cpfValid = cpfDigits.length === 11 && validateCpf(formData.cpf);
  const cpfInvalid = cpfDigits.length === 11 && !validateCpf(formData.cpf);
  const nomeValid = formData.nome.trim().length >= 2;
  const cepDigits = formData.cep.replace(/\D/g, '');

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep] = useState('');

  const handleContinue = () => {
    playStepSound();
    onContinue();
  };

  const montarEnderecoCompleto = () => {
    const partes = [formData.endereco];
    if (formData.enderecoNumero) partes.push(formData.enderecoNumero);
    partes.push(formData.bairro);
    partes.push(`${formData.cidadeCep} - ${formData.estado}`);
    return partes.filter(Boolean).join(', ');
  };

  // Salva CPF assim que o campo perde o foco com CPF válido — mesmo se o lead desistir depois
  const handleCpfBlur = () => {
    if (cpfValid && formData.nome.trim().length >= 2) {
      track('simulacao_cpf_preenchido', {
        nome: formData.nome,
        cpf: formData.cpf,
        endereco: montarEnderecoCompleto(),
        cep: formData.cep,
        dataNascimento: formData.dataNascimento,
      });
    }
  };

  // Auto-complete do CEP — dispara automaticamente quando atinge 8 dígitos
  const handleCepChange = (valor: string) => {
    const formatado = formatCep(valor);
    updateForm('cep', formatado);
    setErroCep('');

    const digitos = formatado.replace(/\D/g, '');
    if (digitos.length === 8) {
      buscarCep(digitos);
    } else if (digitos.length < 8) {
      // Se o usuário apagou dígitos, limpa os campos de endereço
      updateForm('endereco', '');
      updateForm('bairro', '');
      updateForm('cidadeCep', '');
      updateForm('estado', '');
    }
  };

  const buscarCep = async (cep: string) => {
    setBuscandoCep(true);
    setErroCep('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErroCep('CEP não encontrado');
        updateForm('endereco', '');
        updateForm('bairro', '');
        updateForm('cidadeCep', '');
        updateForm('estado', '');
      } else {
        updateForm('endereco', data.logradouro || '');
        updateForm('bairro', data.bairro || '');
        updateForm('cidadeCep', data.localidade || '');
        updateForm('estado', data.uf || '');
      }
    } catch {
      setErroCep('Erro ao consultar CEP. Digite o endereço manualmente.');
    }
    setBuscandoCep(false);
  };

  return (
    <div className="animate-fade-in max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
      <div className="mb-6">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-white mb-1">
          Seus dados
        </h2>
        <p className="text-sm text-white/40">
          Preencha para iniciar sua simulação de financiamento.
        </p>
      </div>

      {/* CPF */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
          CPF
        </label>
        <input
          type="text"
          value={formData.cpf}
          onChange={(e) => updateForm('cpf', formatCpf(e.target.value))}
          onBlur={handleCpfBlur}
          placeholder="000.000.000-00"
          maxLength={14}
          className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:ring-1 transition-all duration-300 text-sm ${
            cpfValid
              ? 'border-emerald-500/50 focus:border-emerald-500/80 focus:ring-emerald-500/20'
              : cpfInvalid
                ? 'border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20'
                : 'border-white/[0.08] focus:border-primary-500/60 focus:ring-primary-500/20'
          }`}
        />
        {cpfValid && (
          <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
            <i className="ri-check-line" />
            CPF válido
          </p>
        )}
        {cpfInvalid && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <i className="ri-close-line" />
            CPF inválido
          </p>
        )}
      </div>

      {/* Nome */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
          Nome completo
        </label>
        <input
          type="text"
          value={formData.nome}
          onChange={(e) => updateForm('nome', e.target.value)}
          placeholder="Digite seu nome"
          className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:ring-1 transition-all duration-300 text-sm ${
            nomeValid
              ? 'border-emerald-500/50 focus:border-emerald-500/80 focus:ring-emerald-500/20'
              : 'border-white/[0.08] focus:border-primary-500/60 focus:ring-primary-500/20'
          }`}
        />
      </div>

      {/* Data de Nascimento */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
          Data de nascimento
        </label>
        <input
          type="text"
          value={formData.dataNascimento}
          onChange={(e) => updateForm('dataNascimento', formatDataNasc(e.target.value))}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm"
        />
      </div>

      {/* Endereço completo via CEP */}
      <div className="mb-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
          Endereço completo
        </p>

        {/* CEP */}
        <div>
          <label className="block text-[10px] font-medium text-white/50 mb-1">
            CEP
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              className={`w-full bg-white/[0.04] border rounded-xl pl-4 pr-10 py-2.5 text-white placeholder-white/25 focus:outline-none focus:ring-1 transition-all duration-300 text-sm ${
                erroCep
                  ? 'border-red-500/50 focus:border-red-500/80 focus:ring-red-500/20'
                  : cepDigits.length === 8 && !erroCep
                    ? 'border-emerald-500/50 focus:border-emerald-500/80 focus:ring-emerald-500/20'
                    : 'border-white/[0.08] focus:border-primary-500/60 focus:ring-primary-500/20'
              }`}
            />
            {buscandoCep && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              </div>
            )}
            {!buscandoCep && cepDigits.length === 8 && !erroCep && formData.endereco && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                <i className="ri-check-line text-sm" />
              </div>
            )}
          </div>
          {erroCep && (
            <p className="mt-1 text-xs text-red-400">{erroCep}</p>
          )}
          {!erroCep && cepDigits.length === 8 && formData.endereco && (
            <p className="mt-1 text-xs text-emerald-400/70">Endereço encontrado automaticamente</p>
          )}
        </div>

        {/* Endereço (rua/av) + Número lado a lado */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="block text-[10px] font-medium text-white/50 mb-1">
              Endereço
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => updateForm('endereco', e.target.value)}
              placeholder="Rua/Avenida"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/50 mb-1">
              Número
            </label>
            <input
              type="text"
              value={formData.enderecoNumero}
              onChange={(e) => updateForm('enderecoNumero', e.target.value)}
              placeholder="S/N"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm"
            />
          </div>
        </div>

        {/* Bairro + Cidade + Estado */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-medium text-white/50 mb-1">
              Bairro
            </label>
            <input
              type="text"
              value={formData.bairro}
              onChange={(e) => updateForm('bairro', e.target.value)}
              placeholder="Bairro"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white placeholder-white/25 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-all duration-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-white/50 mb-1">
              Cidade/UF
            </label>
            <input
              type="text"
              value={formData.cidadeCep ? `${formData.cidadeCep}${formData.estado ? ` - ${formData.estado}` : ''}` : ''}
              readOnly
              className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5 text-white/50 text-sm cursor-default"
            />
          </div>
        </div>
      </div>

      {/* Mensagem de privacidade */}
      <div className="mb-5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-2">
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className="ri-shield-check-line text-sm text-emerald-400/70" />
        </div>
        <p className="text-[11px] text-white/35 leading-relaxed">
          Fique tranquilo! Seus dados estão seguros e serão usados <strong className="text-white/50 font-medium">exclusivamente</strong> para consulta de crédito. Não compartilhamos suas informações com terceiros.
        </p>
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canProceed}
        className={`chrome-btn ${canProceed ? '' : 'opacity-40 cursor-not-allowed'}`}
      >
        <span>Avançar</span>
        <i className="ri-arrow-right-line ml-2" />
      </button>
    </div>
  );
}

/* ========== STEP 2: WHATSAPP ========== */
interface Step2Props {
  formData: { whatsapp: string };
  updateForm: (key: string, value: string) => void;
  formatWhatsApp: (value: string) => string;
  canProceed: boolean;
  onBack: () => void;
  onContinue: () => void;
}

export function Step2View({
  formData,
  updateForm,
  formatWhatsApp,
  canProceed,
  onBack,
  onContinue,
}: Step2Props) {
  const handleContinue = () => {
    playStepSound();
    onContinue();
  };

  const handleBack = () => {
    playClickSound();
    onBack();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-white mb-1">
          Seu contato
        </h2>
        <p className="text-sm text-white/40">
          Por onde enviamos o resultado da sua simulação.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">
          WhatsApp
        </label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
            <i className="ri-whatsapp-line text-lg" />
          </div>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => updateForm('whatsapp', formatWhatsApp(e.target.value))}
            placeholder="(00) 00000-0000"
            className={`w-full bg-white/[0.04] border rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-white/25 focus:outline-none focus:ring-1 transition-all duration-300 text-sm ${
              formData.whatsapp.replace(/\D/g, '').length >= 11
                ? 'border-emerald-500/50 focus:border-emerald-500/80 focus:ring-emerald-500/20'
                : 'border-white/[0.08] focus:border-primary-500/60 focus:ring-primary-500/20'
            }`}
          />
        </div>
        <p className="mt-2 text-xs text-white/25">
          Enviaremos o resultado por WhatsApp em poucos segundos.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-3.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 transition-all duration-300 text-sm font-medium cursor-pointer"
        >
          <i className="ri-arrow-left-line mr-1" />
          Voltar
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canProceed}
          className={`flex-[2] chrome-btn ${canProceed ? '' : 'opacity-40 cursor-not-allowed'}`}
        >
          <span>Avançar</span>
          <i className="ri-arrow-right-line ml-2" />
        </button>
      </div>
    </div>
  );
}

/* ========== STEP 3: PERFIL ========== */
interface Step3Props {
  onSelect: (perfilId: string) => void;
  onBack: () => void;
}

export function Step3View({ onSelect, onBack }: Step3Props) {
  const handleBack = () => {
    playClickSound();
    onBack();
  };

  const handleSelect = (perfilId: string) => {
    playStepSound();
    onSelect(perfilId);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-white mb-1">
          Sua situação
        </h2>
        <p className="text-sm text-white/40">
          Escolha a opção que melhor descreve você:
        </p>
      </div>

      <div className="space-y-2 mb-6">
        {perfis.map((perfil) => {
          const isBloqueado = perfil.categoria === 'bloqueado';
          return (
            <button
              key={perfil.id}
              type="button"
              onClick={() => handleSelect(perfil.id)}
              className={`cursor-pointer w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-300 group ${
                isBloqueado
                  ? 'bg-white/[0.02] border-white/[0.06] hover:border-secondary-500/40 hover:bg-secondary-950/10'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-emerald-500/40 hover:bg-emerald-950/10 hover:-translate-y-px'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-colors duration-300 ${
                      isBloqueado
                        ? 'bg-secondary-500/10 text-secondary-400'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {isBloqueado ? (
                      <i className="ri-forbid-line text-sm" />
                    ) : perfil.categoria === 'sem_entrada' ? (
                      <i className="ri-shield-check-line text-sm" />
                    ) : (
                      <i className="ri-bank-card-line text-sm" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        isBloqueado ? 'text-secondary-300' : 'text-white/80'
                      }`}
                    >
                      {perfil.label}
                    </p>
                    <p className="text-xs text-white/30">{perfil.sublabel}</p>
                  </div>
                </div>
                <i
                  className={`ri-arrow-right-s-line transition-colors duration-300 ${
                    isBloqueado
                      ? 'text-white/15 group-hover:text-secondary-500/60'
                      : 'text-white/15 group-hover:text-emerald-400'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleBack}
        className="w-full py-3.5 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 transition-all duration-300 text-sm font-medium cursor-pointer"
      >
        <i className="ri-arrow-left-line mr-1" />
        Voltar
      </button>
    </div>
  );
}

/* ========== CONSULTING VIEW ========== */
export function ConsultingView() {
  return (
    <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
      <div className="relative w-14 h-14 mb-6">
        <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
        <div className="absolute inset-0 rounded-full border-[3px] border-primary-500 border-t-transparent animate-spin" />
      </div>
      <h2 className="font-heading text-lg sm:text-xl font-semibold text-white text-center mb-2">
        Verificando elegibilidade...
      </h2>
      <p className="text-sm text-white/30 text-center max-w-xs leading-relaxed">
        Estamos analisando as melhores condições de pagamento para o seu perfil.
      </p>
      <div className="mt-6 w-full max-w-[200px] h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full animate-[progress_3s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

/* ========== APPROVED VIEW ========== */
interface ApprovedProps {
  nome: string;
  perfilLabel: string;
  onVerCatalogo: () => void;
  origemCatalogo?: boolean;
  motoNome?: string;
  onEnviarWhatsApp?: () => void;
}

export function ApprovedView({ nome, perfilLabel, onVerCatalogo, origemCatalogo, motoNome, onEnviarWhatsApp }: ApprovedProps) {
  useEffect(() => {
    playSuccessSound();
  }, []);

  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <i className="ri-check-line text-3xl sm:text-4xl" />
        </div>
      </div>

      <h2 className="font-heading text-xl sm:text-2xl font-bold text-white text-center">
        Parabéns, {nome.split(' ')[0]}!
      </h2>
      <p className="mt-3 text-base text-white/60 text-center leading-relaxed">
        Você está{' '}
        <span className="text-emerald-400 font-semibold">aprovado</span> para financiamento.
      </p>

      <div className="mt-4 px-5 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl w-full">
        <p className="text-sm text-emerald-300 font-medium text-center">
          Condição: {perfilLabel}
        </p>
      </div>

      {origemCatalogo && motoNome && (
        <div className="mt-3 px-5 py-2.5 bg-primary-500/5 border border-primary-500/20 rounded-xl w-full">
          <p className="text-xs text-primary-300 text-center">
            Modelo escolhido: <span className="font-semibold">{motoNome}</span>
          </p>
        </div>
      )}

      <p className="mt-5 text-sm text-white/30 text-center max-w-xs leading-relaxed">
        {origemCatalogo
          ? 'Seu modelo já foi selecionado. Envie seu pedido agora mesmo pelo WhatsApp.'
          : 'Agora é só escolher sua moto no catálogo e finalizar a compra.'}
      </p>

      <div className="mt-8 flex flex-col w-full gap-3">
        {origemCatalogo ? (
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onEnviarWhatsApp?.();
            }}
            className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-300 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-whatsapp-line mr-2" />
            <span>Enviar pedido pelo WhatsApp</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onVerCatalogo();
            }}
            className="w-full py-3.5 px-6 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-300 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-motorbike-line mr-2" />
            <span>Escolher minha moto</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ========== REJECTED VIEW ========== */

export function RejectedView() {
  useEffect(() => {
    playErrorSound();
  }, []);

  return (
    <div className="flex flex-col items-center py-6 animate-fade-in">
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-6">
        <i className="ri-close-line text-3xl sm:text-4xl" />
      </div>

      <h2 className="font-heading text-xl sm:text-2xl font-bold text-white text-center">
        Agradecemos seu interesse
      </h2>
      <p className="mt-4 text-sm sm:text-base text-white/50 text-center leading-relaxed max-w-xs">
        Infelizmente,{' '}
        <span className="text-white/70 font-medium">
          no momento não temos opções de crédito
        </span>{' '}
        disponíveis para o seu perfil.
      </p>
      <p className="mt-3 text-sm text-white/25 text-center max-w-xs leading-relaxed">
        Fique atento às nossas novidades. Em breve teremos novas condições especiais.
      </p>
    </div>
  );
}