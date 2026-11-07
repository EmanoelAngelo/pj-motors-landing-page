import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { perfis } from '@/mocks/simulacao';
import { formatCpf, validateCpf } from '@/utils/cpf';
import { motos, montarMensagemWhatsApp, WPP_NUMERO } from '@/mocks/catalogo';
import { track, trackKeepalive, getSessionId } from '@/utils/tracker';
import { metaPixelPageView, metaPixel, metaPixelCustom } from '@/utils/metaPixel';
import StepIndicator from './components/StepIndicator';
import {
  Step1View,
  Step2View,
  Step3View,
  ConsultingView,
  ApprovedView,
  RejectedView,
} from './components/FormSteps';

const BG_IMAGE =
  'https://storage.readdy-site.link/project_files/023b3c8f-be68-40b3-b326-f509d0efa7e6/33164429-b847-4bec-87e7-2f0447a70eeb_compressed_ultra_high_resolution_ultra_sharp_profes_41da0790.webp';

export default function Simulacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const origemCatalogo = searchParams.get('origem') === 'catalogo';
  const modeloId = searchParams.get('modelo') || '';
  const motoSelecionada = motos.find((m) => m.id === modeloId);
  const origem = origemCatalogo ? 'catalogo' : 'home';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    cep: '',
    endereco: '',
    enderecoNumero: '',
    bairro: '',
    cidadeCep: '',
    estado: '',
    dataNascimento: '',
    whatsapp: '',
    perfilId: '',
  });
  const [consulting, setConsulting] = useState(false);
  const [result, setResult] = useState<'aprovado' | 'recusado' | null>(null);

  // Proteção contra unmount: evita setState após desmontagem
  const mountedRef = useRef(true);
  const consultaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Limpa timeout pendente da consulta se o componente for desmontado
      if (consultaTimeoutRef.current) {
        clearTimeout(consultaTimeoutRef.current);
        consultaTimeoutRef.current = null;
      }
    };
  }, []);

  // Tracking: viewed simulation + page_view
  useEffect(() => {
    track('viewed_simulacao', { origem });
    metaPixel('ViewContent', {
      content_name: 'Simulação',
      content_category: 'Funnel',
      origem,
    });
  }, []);

  useEffect(() => {
    trackKeepalive('page_view');
    metaPixelPageView();
  }, []);

  // ---- Handlers que fazem tracking ANTES de mudar o step ----
  const handleStep1Complete = () => {
    const enderecoCompleto = [formData.endereco];
    if (formData.enderecoNumero) enderecoCompleto.push(formData.enderecoNumero);
    enderecoCompleto.push(formData.bairro);
    enderecoCompleto.push(`${formData.cidadeCep} - ${formData.estado}`);

    track('simulacao_step1', {
      nome: formData.nome,
      cpf: formData.cpf,
      endereco: enderecoCompleto.filter(Boolean).join(', '),
      cep: formData.cep,
      dataNascimento: formData.dataNascimento,
      origem,
    });
    metaPixel('Lead', {
      content_name: 'Simulação Step 1',
      content_category: 'Funnel',
      nome: formData.nome,
      cpf: formData.cpf,
      cidade: formData.cidadeCep,
    });
    setStep(2);
  };

  const handleStep2Complete = () => {
    track('simulacao_step2', { whatsapp: formData.whatsapp, origem });
    setStep(3);
  };

  const handleStep1Back = () => {
    setStep(1);
  };

  const handleStep2Back = () => {
    setStep(2);
  };

  const updateForm = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePerfilSelect = (perfilId: string) => {
    updateForm('perfilId', perfilId);
    const perfil = perfis.find((p) => p.id === perfilId);
    if (!perfil) return;

    setConsulting(true);
    track('simulacao_step3', { perfilLabel: perfil.label, perfilId: perfil.id, origem });
    metaPixel('InitiateCheckout', {
      content_name: 'Seleção de Perfil',
      content_category: 'Funnel',
      perfil_label: perfil.label,
    });

    // Limpa timeout anterior se existir
    if (consultaTimeoutRef.current) {
      clearTimeout(consultaTimeoutRef.current);
    }

    consultaTimeoutRef.current = setTimeout(() => {
      consultaTimeoutRef.current = null;
      if (!mountedRef.current) return; // Não atualiza se desmontado
      setConsulting(false);
      setResult(perfil.aprovado ? 'aprovado' : 'recusado');

      const enderecoCompleto = [formData.endereco];
      if (formData.enderecoNumero) enderecoCompleto.push(formData.enderecoNumero);
      enderecoCompleto.push(formData.bairro);
      enderecoCompleto.push(`${formData.cidadeCep} - ${formData.estado}`);

      track('simulacao_result', {
        status: perfil.aprovado ? 'aprovado' : 'recusado',
        perfilLabel: perfil.label,
        nome: formData.nome,
        cpf: formData.cpf,
        whatsapp: formData.whatsapp,
        endereco: enderecoCompleto.filter(Boolean).join(', '),
        cep: formData.cep,
        dataNascimento: formData.dataNascimento,
        origem,
      });

      if (perfil.aprovado) {
        metaPixel('CompleteRegistration', {
          content_name: 'Simulação Aprovada',
          content_category: 'Funnel',
          perfil_label: perfil.label,
          nome: formData.nome,
          cidade: formData.cidadeCep,
        });
      } else {
        metaPixelCustom('simulacao_recusada', {
          perfil_label: perfil.label,
        });
      }
    }, 3500);
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const formatDataNasc = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const canProceedStep1 =
    formData.nome.trim().length >= 2 &&
    validateCpf(formData.cpf) &&
    formData.endereco.trim() !== '' &&
    formData.bairro.trim() !== '' &&
    formData.cidadeCep.trim() !== '' &&
    formData.cep.replace(/\D/g, '').length === 8;
  const canProceedStep2 = formData.whatsapp.replace(/\D/g, '').length >= 11;

  const cidadeFinal = formData.cidadeCep;
  const perfilLabel = perfis.find((p) => p.id === formData.perfilId)?.label || '';

  const handleAprovadoCatalogo = () => {
    if (!motoSelecionada) return;

    const enderecoCompleto = [formData.endereco];
    if (formData.enderecoNumero) enderecoCompleto.push(formData.enderecoNumero);
    enderecoCompleto.push(formData.bairro);
    enderecoCompleto.push(`${formData.cidadeCep} - ${formData.estado}`);

    const enderecoFinal = enderecoCompleto.filter(Boolean).join(', ');

    track('compra_enviada', {
      modelo: motoSelecionada.nome,
      preco: motoSelecionada.preco,
      tipo: 'financiado',
      nome: formData.nome,
      cpf: formData.cpf,
      whatsapp: formData.whatsapp,
      perfil: perfilLabel,
      endereco: enderecoFinal,
      cep: formData.cep,
      dataNascimento: formData.dataNascimento,
      origem: 'simulacao_direto',
    });

    metaPixel('Purchase', {
      content_ids: [motoSelecionada.id],
      content_name: motoSelecionada.nome,
      content_type: 'product',
      value: motoSelecionada.precoNum,
      currency: 'BRL',
      nome: formData.nome,
      perfil: perfilLabel,
    });
    metaPixel('Contact', {
      content_name: 'WhatsApp Compra',
      content_category: 'Funnel',
    });

    const msg = montarMensagemWhatsApp(
      formData.nome,
      formData.cpf,
      cidadeFinal,
      formData.whatsapp,
      perfilLabel,
      motoSelecionada,
      'financiado',
      enderecoFinal,
      formData.cep,
      formData.dataNascimento,
    );
    window.open(`https://wa.me/${WPP_NUMERO}?text=${msg}`, '_blank');
  };

  return (
    <main className="relative w-full bg-black overflow-hidden">
      {/* Background texture — moto image very subtle */}
      <div className="fixed inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt=""
          className="w-full h-full object-cover object-center opacity-[0.04] blur-xl brightness-50 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(25,25,30,0.8)_0%,transparent_70%)]" />
      </div>

      {/* ===== TUDO NA PARTE SUPERIOR ===== */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-2 sm:pt-4 pb-6">
        {/* Title */}
        <div className="text-center mt-1">
          <p className="text-[10px] sm:text-xs font-medium text-primary-500/80 uppercase tracking-[0.2em]">
            Financiamento
          </p>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-normal tracking-wide">
            Simulação de Crédito
          </h1>
          <p className="text-sm text-white/30 max-w-sm mx-auto leading-relaxed mt-1.5">
            Descubra em segundos se você está aprovado para levar sua moto elétrica.
          </p>
        </div>

        {/* Info do modelo se veio do catálogo */}
        {origemCatalogo && motoSelecionada && (
          <div className="mt-4 w-full max-w-md mx-auto bg-primary-500/5 border border-primary-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-background-900">
              <img src={motoSelecionada.imagem} alt={motoSelecionada.nome} className="w-full h-full object-cover object-top" />
            </div>
            <div>
              <p className="text-xs text-primary-400 font-medium">Modelo selecionado</p>
              <p className="text-sm text-white font-semibold">{motoSelecionada.nome} — {motoSelecionada.preco}</p>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mt-5">
          {!consulting && !result && <StepIndicator currentStep={step} totalSteps={3} />}
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md mx-auto bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-5 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.6)] mt-4">
          {consulting && <ConsultingView />}

          {result === 'aprovado' && (
            <ApprovedView
              nome={formData.nome}
              perfilLabel={perfilLabel}
              origemCatalogo={origemCatalogo}
              motoNome={motoSelecionada?.nome}
              onVerCatalogo={() => {
                const enderecoCompleto = [formData.endereco];
                if (formData.enderecoNumero) enderecoCompleto.push(formData.enderecoNumero);
                enderecoCompleto.push(formData.bairro);
                enderecoCompleto.push(`${formData.cidadeCep} - ${formData.estado}`);

                const params = new URLSearchParams({
                  modo: 'aprovado',
                  perfil: perfilLabel,
                  nome: formData.nome,
                  cpf: formData.cpf,
                  cidade: cidadeFinal,
                  whatsapp: formData.whatsapp,
                  endereco: enderecoCompleto.filter(Boolean).join(', '),
                  cep: formData.cep,
                  dataNascimento: formData.dataNascimento,
                });
                navigate(`/catalogo?${params.toString()}`);
              }}
              onEnviarWhatsApp={handleAprovadoCatalogo}
            />
          )}

          {result === 'recusado' && <RejectedView />}

          {!consulting && !result && step === 1 && (
            <Step1View
              formData={formData}
              updateForm={updateForm}
              formatCpf={formatCpf}
              formatCep={formatCep}
              formatDataNasc={formatDataNasc}
              validateCpf={validateCpf}
              canProceed={canProceedStep1}
              onContinue={handleStep1Complete}
            />
          )}

          {!consulting && !result && step === 2 && (
            <Step2View
              formData={formData}
              updateForm={updateForm}
              formatWhatsApp={formatWhatsApp}
              canProceed={canProceedStep2}
              onBack={handleStep2Back}
              onContinue={handleStep2Complete}
            />
          )}

          {!consulting && !result && step === 3 && (
            <Step3View onSelect={handlePerfilSelect} onBack={handleStep1Back} />
          )}
        </div>

        {/* Footer note */}
        {!consulting && !result && (
          <p className="text-[10px] sm:text-xs text-white/15 text-center max-w-xs mt-4">
            Análise rápida e segura. Seus dados são protegidos e não serão compartilhados.
          </p>
        )}
      </div>
    </main>
  );
}