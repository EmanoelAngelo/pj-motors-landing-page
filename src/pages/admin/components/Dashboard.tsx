import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSupabase } from '@/utils/supabase';
import FunnelChart from './FunnelChart';
import ConversionGauge from './ConversionGauge';
import ProfileDonut from './ProfileDonut';
import ActivityHeatmap from './ActivityHeatmap';

export interface LeadEvent {
  id: number;
  session_id: string;
  event_type: string;
  page: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface LeadAgregado {
  session_id: string;
  nome: string;
  cpf: string;
  whatsapp: string;
  cidade: string;
  perfil: string;
  status: string;
  etapa: string;
  endereco: string;
  dataNascimento: string;
  primeiro_evento: string;
  ultimo_evento: string;
  eventos: LeadEvent[];
}

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatarHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarDataHora(iso: string): string {
  return `${formatarData(iso)} ${formatarHora(iso)}`;
}

// Label amigavel para cada tipo de evento
function labelEvento(tipo: string): string {
  const mapa: Record<string, string> = {
    page_view: 'Visitante acessou o site',
    started_session: 'Iniciou atendimento',
    clicked_simulacao: 'Clicou Simulação (Home)',
    clicked_catalogo: 'Clicou Catálogo (Home)',
    viewed_simulacao: 'Abriu Simulação',
    simulacao_cpf_preenchido: 'Preencheu CPF (blur)',
    simulacao_step1: 'Completou Etapa 1 (CPF)',
    simulacao_step2: 'Completou Etapa 2 (WhatsApp)',
    simulacao_step3: 'Escolheu Perfil',
    simulacao_result: 'Resultado Final',
    viewed_catalogo: 'Abriu Catálogo',
    viewed_catalogo_aprovado: 'Catálogo (pós-aprovado)',
    clicked_comprar: 'Clicou Comprar',
    clicked_comprar_financiado: 'Clicou Comprar Financiado',
    clicked_financiamento: 'Clicou Financiamento (Catálogo)',
    clicked_saiba_mais: 'Clicou Saiba Mais',
    compra_enviada: 'Compra Finalizada',
  };
  return mapa[tipo] || tipo;
}

function iconeEvento(tipo: string): string {
  const mapa: Record<string, string> = {
    page_view: 'ri-eye-line',
    started_session: 'ri-play-circle-line',
    clicked_simulacao: 'ri-calculator-line',
    clicked_catalogo: 'ri-store-2-line',
    viewed_simulacao: 'ri-calculator-line',
    simulacao_cpf_preenchido: 'ri-id-card-line',
    simulacao_step1: 'ri-profile-line',
    simulacao_step2: 'ri-whatsapp-line',
    simulacao_step3: 'ri-user-settings-line',
    simulacao_result: 'ri-check-double-line',
    viewed_catalogo: 'ri-store-2-line',
    viewed_catalogo_aprovado: 'ri-shield-check-line',
    clicked_comprar: 'ri-shopping-cart-line',
    clicked_comprar_financiado: 'ri-bank-card-line',
    clicked_financiamento: 'ri-bank-card-line',
    clicked_saiba_mais: 'ri-video-line',
    compra_enviada: 'ri-check-line',
  };
  return mapa[tipo] || 'ri-record-circle-line';
}

// Agrega eventos por session_id para montar o lead completo
function agregarLeads(events: LeadEvent[]): LeadAgregado[] {
  const mapa = new Map<string, LeadEvent[]>();
  for (const e of events) {
    const arr = mapa.get(e.session_id) || [];
    arr.push(e);
    mapa.set(e.session_id, arr);
  }

  const leads: LeadAgregado[] = [];
  for (const [, evts] of mapa) {
    evts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const nome = evts.find((e) => e.data?.nome)?.data?.nome as string || '';
    const cpf = evts.find((e) => e.data?.cpf)?.data?.cpf as string || '';
    const whatsapp = evts.find((e) => e.data?.whatsapp)?.data?.whatsapp as string || '';
    const cidade = evts.find((e) => e.data?.cidade)?.data?.cidade as string || '';
    const perfil = evts.find((e) => e.data?.perfilLabel)?.data?.perfilLabel as string || '';
    const endereco = evts.find((e) => e.data?.endereco)?.data?.endereco as string || '';
    const dataNascimento = evts.find((e) => e.data?.dataNascimento)?.data?.dataNascimento as string || '';

    const temAprovado = evts.some((e) => e.event_type === 'simulacao_result' && e.data?.status === 'aprovado');
    const temRecusado = evts.some((e) => e.event_type === 'simulacao_result' && e.data?.status === 'recusado');
    const temResultado = temAprovado || temRecusado;
    const temWhatsapp = !!whatsapp;
    const temCpf = !!cpf;

    let etapa = 'visitante';
    let status = 'visitante';
    if (temResultado && temAprovado) {
      etapa = 'completo';
      status = 'aprovado';
    } else if (temResultado && temRecusado) {
      etapa = 'completo';
      status = 'recusado';
    } else if (temWhatsapp) {
      etapa = 'whatsapp';
      status = 'lead_quente';
    } else if (temCpf) {
      etapa = 'cpf';
      status = 'lead_morno';
    }

    leads.push({
      session_id: evts[0].session_id,
      nome,
      cpf,
      whatsapp,
      cidade,
      perfil,
      status,
      etapa,
      endereco,
      dataNascimento,
      primeiro_evento: evts[0].created_at,
      ultimo_evento: evts[evts.length - 1].created_at,
      eventos: evts,
    });
  }

  leads.sort((a, b) => new Date(b.ultimo_evento).getTime() - new Date(a.ultimo_evento).getTime());
  return leads;
}

// Remove duplicatas: CPF igual (prioridade máxima) ou WhatsApp + Nome igual = mesma pessoa
// Prioriza o cadastro MAIS COMPLETO (compra_enviada > mais eventos > mais recente)
// CORREÇÃO: Cruza CPF × WhatsApp+Nome — mesma pessoa em 2 dispositivos vira 1 lead
function deduplicarLeads(leads: LeadAgregado[]): LeadAgregado[] {
  const vistoCpf = new Map<string, LeadAgregado>();
  const vistoWhatsNome = new Map<string, LeadAgregado>();
  const semIdentificador: LeadAgregado[] = [];

  // Pontua um lead por completude: compra_enviada vale muito, simulacao_result vale, depois conta eventos
  const score = (l: LeadAgregado): number => {
    let s = 0;
    if (l.eventos.some((e) => e.event_type === 'compra_enviada')) s += 1000;
    if (l.eventos.some((e) => e.event_type === 'simulacao_result')) s += 500;
    s += l.eventos.length;
    return s;
  };

  const manterMaisCompleto = (mapa: Map<string, LeadAgregado>, chave: string, lead: LeadAgregado) => {
    const existente = mapa.get(chave);
    if (!existente) {
      mapa.set(chave, lead);
      return;
    }
    const scoreLead = score(lead);
    const scoreExistente = score(existente);

    if (scoreLead > scoreExistente) {
      mapa.set(chave, lead);
    } else if (scoreLead === scoreExistente) {
      // Desempate: mais recente
      if (new Date(lead.ultimo_evento).getTime() > new Date(existente.ultimo_evento).getTime()) {
        mapa.set(chave, lead);
      }
    }
    // Se scoreLead < scoreExistente, mantém o existente — não faz nada
  };

  // FASE 1: Classifica cada lead no mapa correspondente
  for (const lead of leads) {
    const cpfLimpo = lead.cpf.replace(/\D/g, '');

    if (cpfLimpo && cpfLimpo.length >= 11) {
      manterMaisCompleto(vistoCpf, cpfLimpo, lead);
    } else if (lead.whatsapp && lead.nome) {
      const chave = `${lead.whatsapp.replace(/\D/g, '')}|${lead.nome.trim().toLowerCase()}`;
      manterMaisCompleto(vistoWhatsNome, chave, lead);
    } else {
      semIdentificador.push(lead);
    }
  }

  // FASE 2: Cruza CPF × WhatsApp+Nome
  // Se um lead do vistoWhatsNome compartilha WhatsApp ou Nome com algum lead do vistoCpf,
  // é a MESMA pessoa em dispositivos diferentes — mescla os dados
  const chavesParaRemover: string[] = [];

  for (const [chaveWN, leadWN] of vistoWhatsNome) {
    const whatsappWN = leadWN.whatsapp.replace(/\D/g, '');
    const nomeWN = leadWN.nome.trim().toLowerCase();

    for (const [cpfKey, leadCPF] of vistoCpf) {
      const whatsappCPF = leadCPF.whatsapp.replace(/\D/g, '');
      const nomeCPF = leadCPF.nome.trim().toLowerCase();

      // Match: mesmo WhatsApp OU mesmo Nome entre os dois dispositivos
      const mesmoWhatsapp = whatsappWN && whatsappCPF && whatsappWN === whatsappCPF;
      const mesmoNome = nomeWN && nomeCPF && nomeWN === nomeCPF;

      if (mesmoWhatsapp || mesmoNome) {
        // Mesma pessoa! Decide qual versão manter baseado no score
        const scoreWN = score(leadWN);
        const scoreCPF = score(leadCPF);

        if (scoreWN > scoreCPF) {
          // WhatsApp+Nome é mais completo — mescla dados do CPF nele e substitui no vistoCpf
          leadWN.cpf = leadWN.cpf || leadCPF.cpf;
          leadWN.nome = leadWN.nome || leadCPF.nome;
          leadWN.whatsapp = leadWN.whatsapp || leadCPF.whatsapp;
          leadWN.cidade = leadWN.cidade || leadCPF.cidade;
          leadWN.perfil = leadWN.perfil || leadCPF.perfil;
          leadWN.endereco = leadWN.endereco || leadCPF.endereco;
          leadWN.dataNascimento = leadWN.dataNascimento || leadCPF.dataNascimento;
          // Mescla eventos únicos
          const idsExistentes = new Set(leadWN.eventos.map((e) => e.id));
          for (const evt of leadCPF.eventos) {
            if (!idsExistentes.has(evt.id)) {
              leadWN.eventos.push(evt);
            }
          }
          leadWN.eventos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          leadWN.primeiro_evento = leadWN.eventos[0].created_at;
          leadWN.ultimo_evento = leadWN.eventos[leadWN.eventos.length - 1].created_at;
          // Atualiza etapa/status com os eventos mesclados
          const temAprovado = leadWN.eventos.some((e) => e.event_type === 'simulacao_result' && e.data?.status === 'aprovado');
          const temRecusado = leadWN.eventos.some((e) => e.event_type === 'simulacao_result' && e.data?.status === 'recusado');
          const temResultado = temAprovado || temRecusado;
          if (temResultado && temAprovado) { leadWN.etapa = 'completo'; leadWN.status = 'aprovado'; }
          else if (temResultado && temRecusado) { leadWN.etapa = 'completo'; leadWN.status = 'recusado'; }
          else if (leadWN.whatsapp) { leadWN.etapa = 'whatsapp'; leadWN.status = 'lead_quente'; }
          else if (leadWN.cpf) { leadWN.etapa = 'cpf'; leadWN.status = 'lead_morno'; }
          vistoCpf.set(cpfKey, leadWN);
        } else {
          // CPF é mais completo (ou igual) — mescla dados do WhatsApp+Nome nele
          leadCPF.nome = leadCPF.nome || leadWN.nome;
          leadCPF.whatsapp = leadCPF.whatsapp || leadWN.whatsapp;
          leadCPF.cidade = leadCPF.cidade || leadWN.cidade;
          leadCPF.perfil = leadCPF.perfil || leadWN.perfil;
          leadCPF.endereco = leadCPF.endereco || leadWN.endereco;
          leadCPF.dataNascimento = leadCPF.dataNascimento || leadWN.dataNascimento;
          const idsExistentes = new Set(leadCPF.eventos.map((e) => e.id));
          for (const evt of leadWN.eventos) {
            if (!idsExistentes.has(evt.id)) {
              leadCPF.eventos.push(evt);
            }
          }
          leadCPF.eventos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          leadCPF.primeiro_evento = leadCPF.eventos[0].created_at;
          leadCPF.ultimo_evento = leadCPF.eventos[leadCPF.eventos.length - 1].created_at;
          const temAprovado = leadCPF.eventos.some((e) => e.event_type === 'simulacao_result' && e.data?.status === 'aprovado');
          const temRecusado = leadCPF.eventos.some((e) => e.event_type === 'simulacao_result' && e.data?.status === 'recusado');
          const temResultado = temAprovado || temRecusado;
          if (temResultado && temAprovado) { leadCPF.etapa = 'completo'; leadCPF.status = 'aprovado'; }
          else if (temResultado && temRecusado) { leadCPF.etapa = 'completo'; leadCPF.status = 'recusado'; }
          else if (leadCPF.whatsapp) { leadCPF.etapa = 'whatsapp'; leadCPF.status = 'lead_quente'; }
          else if (leadCPF.cpf) { leadCPF.etapa = 'cpf'; leadCPF.status = 'lead_morno'; }
        }

        chavesParaRemover.push(chaveWN);
        break; // Já encontrou o match, sai do loop interno
      }
    }
  }

  // Remove do vistoWhatsNome os leads que foram mesclados com CPF
  for (const chave of chavesParaRemover) {
    vistoWhatsNome.delete(chave);
  }

  const deduped = [...vistoCpf.values(), ...vistoWhatsNome.values(), ...semIdentificador];
  deduped.sort((a, b) => new Date(b.ultimo_evento).getTime() - new Date(a.ultimo_evento).getTime());

  return deduped;
}

export default function Dashboard() {
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const buscaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sairModal, setSairModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState<string>('todos'); // 'todos' | 'YYYY-MM-DD'
  const [resetConfirmacao, setResetConfirmacao] = useState('');
  const primeiraCarga = useRef(true);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false); // Guard contra fetchs concorrentes (2s de intervalo pode empilhar)

  // Protecao contra unmount: evita setState depois que o componente foi desmontado
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchEvents = useCallback(async (silencioso = false) => {
    if (fetchingRef.current) return; // Já tem um fetch em andamento — pula
    fetchingRef.current = true;

    if (!silencioso) {
      if (mountedRef.current) setCarregando(true);
    } else {
      if (mountedRef.current) setAtualizando(true);
    }
    if (mountedRef.current) setErro('');
    try {
      const supabase = getSupabase();
      const LIMIT = 1000;
      let allEvents: LeadEvent[] = [];
      let hasMore = true;
      let offset = 0;
      let pageCount = 0;
      const MAX_PAGES = 20; // Segurança: máximo 20.000 eventos (20 × 1000)

      // Busca paginada: garante que TODOS os eventos sejam carregados
      // sem perder page_view ou outros eventos antigos por causa do LIMIT
      while (hasMore && pageCount < MAX_PAGES) {
        const { data, error } = await supabase
          .from('lead_events')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + LIMIT - 1);

        if (error) throw error;

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }

        allEvents = allEvents.concat(data as LeadEvent[]);
        offset += LIMIT;

        if (data.length < LIMIT) hasMore = false;
        pageCount++;
      }

      if (mountedRef.current) {
        setEvents(allEvents);
        primeiraCarga.current = false;
      }
    } catch (e: any) {
      if (mountedRef.current && !silencioso) {
        setErro('Erro ao carregar dados. ' + (e.message || ''));
      }
    }
    if (mountedRef.current) {
      setCarregando(false);
      setAtualizando(false);
    }
    fetchingRef.current = false;
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh: busca novos dados a cada 2 segundos (silencioso, sem loading)
  // Pausa quando a aba nao esta visivel para economizar recursos
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        fetchEvents(true);
      }, 2000);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchEvents(true);
        startInterval();
      } else {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };

    startInterval();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchEvents]);

  // Debounce na busca: evita re-render em cada tecla com muitos leads
  useEffect(() => {
    if (buscaTimerRef.current) {
      clearTimeout(buscaTimerRef.current);
    }
    buscaTimerRef.current = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);
    return () => {
      if (buscaTimerRef.current) {
        clearTimeout(buscaTimerRef.current);
      }
    };
  }, [busca]);

  // Dias com dados disponiveis para o seletor
  const diasDisponiveis = useMemo(() => {
    const dias = new Set<string>();
    for (const e of events) {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dias.add(key);
    }
    return Array.from(dias).sort((a, b) => b.localeCompare(a));
  }, [events]);

  // Eventos filtrados pela data selecionada
  const eventosFiltrados = useMemo(() => {
    if (dataSelecionada === 'todos') return events;
    return events.filter((e) => {
      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return key === dataSelecionada;
    });
  }, [events, dataSelecionada]);

  // Ajusta dataSelecionada se o dia atual nao esta mais disponivel (ex: resetou)
  useEffect(() => {
    if (dataSelecionada !== 'todos' && diasDisponiveis.length > 0 && !diasDisponiveis.includes(dataSelecionada)) {
      setDataSelecionada('todos');
    }
  }, [diasDisponiveis, dataSelecionada]);

  // Leads baseados nos eventos filtrados
  const leadsFiltradosPorData = useMemo(() => deduplicarLeads(agregarLeads(eventosFiltrados)), [eventosFiltrados]);

  // Filtros
  const leadsFiltrados = useMemo(() => {
    return leadsFiltradosPorData.filter((l) => {
      // Remove visitantes — sem CPF, sem WhatsApp, sem resultado = nao e lead
      if (l.etapa === 'visitante') return false;

      const termo = buscaDebounced.toLowerCase();
      if (!termo) return true;
      return (
        l.nome.toLowerCase().includes(termo) ||
        l.cpf.includes(termo) ||
        l.whatsapp.includes(termo) ||
        l.cidade.toLowerCase().includes(termo) ||
        l.endereco.toLowerCase().includes(termo) ||
        l.dataNascimento.includes(termo)
      );
    });
  }, [leadsFiltradosPorData, buscaDebounced]);

  // Métricas — definicao precisa:
  // Visitantes = sessoes que tiveram page_view mas NUNCA clicaram em Iniciar
  //              (entrou no link, nao interagiu com o botao inicial)
  // Sessoes    = sessoes onde o usuario CLICOU em Iniciar (started_session)
  //              independente do que aconteceu depois
  // Leads Qualificados = leads que MANDARAM MENSAGEM (compra_enviada)
  const metricas = useMemo(() => {
    const totalVisitantes = leadsFiltradosPorData.filter((l) => {
      const tipos = l.eventos.map((e) => e.event_type);
      return tipos.includes('page_view') && !tipos.includes('started_session');
    }).length;

    const totalSessoes = leadsFiltradosPorData.filter((l) => {
      const tipos = l.eventos.map((e) => e.event_type);
      return tipos.includes('started_session');
    }).length;

    const leadsComCpf = leadsFiltradosPorData.filter((l) => l.cpf).length;
    const leadsComWhatsapp = leadsFiltradosPorData.filter((l) => l.whatsapp).length;

    // Leads Qualificados = quem chegou ate a etapa final e MANDOU MENSAGEM
    // Detectado UNICAMENTE pelo evento compra_enviada (WhatsApp foi enviado com sucesso)
    const leadsQualificados = leadsFiltradosPorData.filter((l) => {
      const tipos = l.eventos.map((e) => e.event_type);
      return tipos.includes('compra_enviada');
    }).length;

    return {
      totalSessoes,
      totalVisitantes,
      leadsComCpf,
      leadsComWhatsapp,
      leadsQualificados,
    };
  }, [leadsFiltradosPorData]);

  // Eventos do dia selecionado para o log detalhado
  const eventosDia = useMemo(() => {
    return eventosFiltrados
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [eventosFiltrados]);

  // Label do dia para exibicao
  const labelDia = useMemo(() => {
    if (dataSelecionada === 'todos') return 'Todos os Dias';
    const [y, m, d] = dataSelecionada.split('-');
    return `${d}/${m}/${y}`;
  }, [dataSelecionada]);

  // Formata data ISO para label BR curto (ex: 09/07)
  const formatarDiaCurto = (iso: string): string => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}`;
  };

  const handleSair = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setSairModal(false);
    window.location.reload();
  };

  const handleReset = async () => {
    if (resetConfirmacao !== 'RESETAR') return;
    setResetando(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('lead_events').delete().gt('id', 0);
      if (error) throw error;
      setEvents([]);
      setResetConfirmacao('');
      setDataSelecionada('todos');
      setResetModal(false);
    } catch (e: any) {
      setErro('Erro ao resetar dados. ' + (e.message || ''));
      setResetModal(false);
    }
    setResetando(false);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-background-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-foreground-500">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-background-950 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <i className="ri-error-warning-line text-xl text-red-400" />
          </div>
          <p className="text-sm text-foreground-300 mb-2">Erro ao carregar dados</p>
          <p className="text-xs text-foreground-500 mb-4">{erro}</p>
          <button
            onClick={fetchEvents}
            className="px-6 py-2.5 rounded-xl bg-primary-500 text-background-50 text-sm font-medium cursor-pointer hover:bg-primary-600 transition-all whitespace-nowrap"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background-950 pb-20">
      {/* Header fixo */}
      <header className="sticky top-0 z-40 bg-background-950/95 backdrop-blur-md border-b border-background-800/50">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
              <i className="ri-motorbike-line text-sm text-primary-400" />
            </div>
            <span className="font-heading text-sm font-bold text-foreground-100">PJ Motors</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchEvents()}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-background-800/50 text-foreground-400 hover:text-foreground-200 transition-colors cursor-pointer relative"
              title="Atualizar"
            >
              <i className={`ri-refresh-line text-sm ${atualizando ? 'animate-spin' : ''}`} />
              {atualizando && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-400" />
              )}
            </button>
            <button
              onClick={() => setSairModal(true)}
              className="text-xs text-foreground-500 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <i className="ri-logout-box-r-line" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Cards de métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-foreground-500 uppercase tracking-wider">Sessões</p>
            <p className="text-2xl font-bold text-foreground-100 mt-1">{metricas.totalSessoes}</p>
          </div>
          <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-foreground-500 uppercase tracking-wider">Leads c/ CPF</p>
            <p className="text-2xl font-bold text-primary-400 mt-1">{metricas.leadsComCpf}</p>
          </div>
          <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-foreground-500 uppercase tracking-wider">Visitantes</p>
            <p className="text-2xl font-bold text-foreground-100 mt-1">{metricas.totalVisitantes}</p>
          </div>
          <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-foreground-500 uppercase tracking-wider">Leads c/ WhatsApp</p>
            <p className="text-2xl font-bold text-accent-400 mt-1">{metricas.leadsComWhatsapp}</p>
          </div>
        </div>

        {/* Card Leads Qualificados — destaque */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
              <i className="ri-star-fill text-sm text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-amber-400/80 uppercase tracking-wider">Leads Qualificados</p>
              <p className="text-2xl font-bold text-amber-300 mt-0.5">{metricas.leadsQualificados}</p>
            </div>
          </div>
          <p className="text-[11px] text-amber-400/50 mt-2">
            Usuários que finalizaram o processo e mandaram mensagem via WhatsApp
          </p>
        </div>

        {/* === AUDITORIA VISUAL — GRÁFICOS === */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-primary-500/15 border border-primary-500/25 flex items-center justify-center">
              <i className="ri-bar-chart-box-line text-sm text-primary-400" />
            </div>
            <p className="text-sm font-semibold text-foreground-200">Auditoria de Campanha</p>
          </div>

          <FunnelChart leads={leadsFiltradosPorData} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ConversionGauge leads={leadsFiltradosPorData} />
            <ProfileDonut leads={leadsFiltradosPorData} />
          </div>

          <ActivityHeatmap events={eventosFiltrados} leads={leadsFiltradosPorData} />
        </div>

        {/* Busca e filtros */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-600">
              <i className="ri-search-line text-base" />
            </div>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF, WhatsApp ou cidade..."
              className="w-full bg-background-900 border border-background-700/50 rounded-xl pl-10 pr-4 py-3 text-sm text-foreground-100 placeholder-foreground-700 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>

        {/* Tabela de leads — cards no mobile, tabela no desktop */}
        <div className="bg-background-900/60 border border-background-700/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-background-700/40 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground-500 uppercase tracking-wider">
              Leads ({leadsFiltrados.length})
            </p>
          </div>

          {leadsFiltrados.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <i className="ri-user-search-line text-2xl text-foreground-700" />
              <p className="text-sm text-foreground-600 mt-2">Nenhum lead encontrado</p>
            </div>
          ) : (
            <>
              {/* Cards no mobile */}
              <div className="md:hidden divide-y divide-background-800/30">
                {leadsFiltrados.map((lead) => {
                  const isQualificado = lead.eventos.some((e) => e.event_type === 'compra_enviada');
                  return (
                    <div key={lead.session_id} className="p-4 space-y-2.5">
                      {/* Nome + status */}
                      <div className="flex items-center gap-2">
                        {isQualificado && (
                          <i className="ri-star-fill text-xs text-amber-400 flex-shrink-0" title="Lead Qualificado" />
                        )}
                        <span className="text-sm font-semibold text-foreground-100">
                          {lead.nome || <span className="text-foreground-700 font-normal">Nome não informado</span>}
                        </span>
                      </div>

                      {/* Grid de dados */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <p className="text-[10px] text-foreground-600 uppercase tracking-wider">CPF</p>
                          <p className="text-xs text-foreground-300 font-mono">{lead.cpf || <span className="text-foreground-700">—</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-foreground-600 uppercase tracking-wider">WhatsApp</p>
                          <p className="text-xs text-foreground-300">{lead.whatsapp || <span className="text-foreground-700">—</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-foreground-600 uppercase tracking-wider">Cidade</p>
                          <p className="text-xs text-foreground-400">{lead.cidade || <span className="text-foreground-700">—</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-foreground-600 uppercase tracking-wider">Nascimento</p>
                          <p className="text-xs text-foreground-400">{lead.dataNascimento || <span className="text-foreground-700">—</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-foreground-600 uppercase tracking-wider">Perfil</p>
                          <p className="text-xs text-foreground-400">{lead.perfil || <span className="text-foreground-700">—</span>}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-foreground-600 uppercase tracking-wider">Data</p>
                          <p className="text-xs text-foreground-500">{formatarDataHora(lead.ultimo_evento)}</p>
                        </div>
                      </div>

                      {/* Endereço em linha inteira */}
                      {lead.endereco && (
                        <div>
                          <p className="text-[10px] text-foreground-600 uppercase tracking-wider">Endereço</p>
                          <p className="text-xs text-foreground-400 leading-relaxed">{lead.endereco}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Tabela no desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-background-700/30">
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">Nome</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">CPF</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">WhatsApp</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">Cidade</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">Endereço</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">Nascimento</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">Perfil</th>
                      <th className="px-4 py-2.5 text-xs font-medium text-foreground-600 uppercase tracking-wider">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsFiltrados.map((lead) => {
                      const isQualificado = lead.eventos.some((e) => e.event_type === 'compra_enviada');
                      return (
                      <tr key={lead.session_id} className="border-b border-background-800/30 hover:bg-background-800/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground-200 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            {isQualificado && (
                              <i className="ri-star-fill text-xs text-amber-400" title="Lead Qualificado" />
                            )}
                            {lead.nome || <span className="text-foreground-700">—</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-300 whitespace-nowrap font-mono">
                          {lead.cpf || <span className="text-foreground-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-300 whitespace-nowrap">
                          {lead.whatsapp || <span className="text-foreground-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-400 whitespace-nowrap">
                          {lead.cidade || <span className="text-foreground-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-400 whitespace-nowrap max-w-[200px] truncate" title={lead.endereco}>
                          {lead.endereco || <span className="text-foreground-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-400 whitespace-nowrap">
                          {lead.dataNascimento || <span className="text-foreground-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground-400 whitespace-nowrap">
                          {lead.perfil || <span className="text-foreground-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground-600 whitespace-nowrap">
                          {formatarDataHora(lead.ultimo_evento)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Registros — timeline detalhada */}
        <div className="bg-background-900/60 border border-background-700/40 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-background-700/40 flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-foreground-500 uppercase tracking-wider whitespace-nowrap">
              Registros — {labelDia} ({eventosDia.length})
            </p>
            <select
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="bg-background-800 border border-background-700/50 rounded-lg px-3 py-1.5 text-xs text-foreground-200 cursor-pointer hover:border-background-600/60 transition-colors focus:outline-none focus:border-primary-500/50 appearance-none pr-7"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
              }}
            >
              <option value="todos">Todos os dias ({events.length} eventos)</option>
              {diasDisponiveis.map((dia) => (
                <option key={dia} value={dia}>
                  {formatarDiaCurto(dia)} — {events.filter((e) => {
                    const d = new Date(e.created_at);
                    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    return key === dia;
                  }).length} eventos
                </option>
              ))}
            </select>
          </div>

          {eventosDia.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <i className="ri-calendar-event-line text-xl text-foreground-700" />
              <p className="text-sm text-foreground-600 mt-2">
                {dataSelecionada === 'todos' ? 'Nenhum registro encontrado' : 'Nenhum registro neste dia'}
              </p>
              <p className="text-xs text-foreground-700 mt-1">Selecione outro dia ou "Todos os dias"</p>
            </div>
          ) : (
            <div className="divide-y divide-background-800/30 max-h-80 overflow-y-auto">
              {eventosDia.map((evt) => (
                <div key={evt.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-background-800/20 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-background-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className={`${iconeEvento(evt.event_type)} text-sm text-foreground-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground-200">{labelEvento(evt.event_type)}</span>
                      {evt.data?.origem && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          evt.data.origem === 'catalogo'
                            ? 'bg-accent-500/15 text-accent-400'
                            : 'bg-primary-500/15 text-primary-400'
                        }`}>
                          {evt.data.origem === 'catalogo' ? 'Catálogo' : 'Home'}
                        </span>
                      )}
                    </div>
                    {evt.data && Object.keys(evt.data).filter(k => k !== 'origem').length > 0 && (
                      <p className="text-xs text-foreground-600 mt-0.5 truncate">
                        {Object.entries(evt.data)
                          .filter(([k]) => k !== 'origem')
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' | ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-foreground-700 whitespace-nowrap flex-shrink-0">
                    {formatarHora(evt.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de reset */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!resetando) { setResetModal(false); setResetConfirmacao(''); } }} />
          <div className="relative z-10 w-full max-w-sm bg-background-900 border border-red-500/20 rounded-2xl p-5">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <i className="ri-alert-line text-lg text-red-400" />
            </div>
            <p className="text-sm font-medium text-foreground-100 text-center mb-1">Resetar todos os dados?</p>
            <p className="text-xs text-foreground-500 text-center mb-4">
              Isso vai apagar <strong className="text-foreground-300">todos</strong> os registros de leads, sessões e eventos de <strong className="text-foreground-300">todos os dias</strong>. Esta ação é <strong className="text-red-400">irreversível</strong>.
            </p>
            <p className="text-xs text-foreground-600 text-center mb-3">
              Digite <strong className="text-red-400 font-mono">RESETAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={resetConfirmacao}
              onChange={(e) => setResetConfirmacao(e.target.value)}
              placeholder="Digite RESETAR..."
              disabled={resetando}
              className="w-full bg-background-800 border border-background-700/50 rounded-lg px-3 py-2 text-sm text-foreground-100 placeholder-foreground-700 text-center font-mono tracking-widest focus:outline-none focus:border-red-500/50 transition-all mb-4 disabled:opacity-50"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setResetModal(false); setResetConfirmacao(''); }}
                disabled={resetando}
                className="flex-1 py-2.5 rounded-xl bg-background-800 text-foreground-300 text-sm font-medium cursor-pointer hover:bg-background-700 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={resetando || resetConfirmacao !== 'RESETAR'}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 transition-colors ${
                  resetConfirmacao === 'RESETAR'
                    ? 'bg-red-500 text-background-50 hover:bg-red-600'
                    : 'bg-background-800 text-foreground-700 cursor-not-allowed'
                } disabled:opacity-50`}
              >
                {resetando ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-background-50/30 border-t-background-50 rounded-full animate-spin" />
                    Apagando...
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line text-sm" />
                    Resetar tudo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sair */}
      {sairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSairModal(false)} />
          <div className="relative z-10 w-full max-w-xs bg-background-900 border border-background-700/40 rounded-2xl p-5">
            <p className="text-sm font-medium text-foreground-100 mb-1">Sair do painel?</p>
            <p className="text-xs text-foreground-500 mb-4">Você precisará fazer login novamente.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSairModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-background-800 text-foreground-300 text-sm font-medium cursor-pointer hover:bg-background-700 transition-colors whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={handleSair}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm font-medium cursor-pointer hover:bg-red-500/25 transition-colors whitespace-nowrap"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra inferior — ações administrativas (longe do alcance acidental) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background-950/95 backdrop-blur-md border-t border-background-800/50">
        <div className="px-4 h-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-foreground-700 uppercase tracking-wider">Admin</span>
            <span className="w-1 h-1 rounded-full bg-background-700" />
            <span className="text-[9px] text-foreground-600">PJ Motors</span>
          </div>
          <button
            onClick={() => setResetModal(true)}
            disabled={resetando}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/80 hover:bg-red-500/20 hover:text-red-300 transition-all cursor-pointer"
            title="Resetar todos os dados"
          >
            <i className={`ri-delete-bin-line text-xs ${resetando ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-medium whitespace-nowrap">Resetar dados</span>
          </button>
        </div>
      </div>
    </div>
  );
}