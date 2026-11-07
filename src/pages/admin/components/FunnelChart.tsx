import { useMemo } from 'react';
import type { LeadAgregado } from './Dashboard';

interface FunnelChartProps {
  leads: LeadAgregado[];
}

interface FunnelStep {
  label: string;
  count: number;
  colorClass: string;
  bgClass: string;
}

export default function FunnelChart({ leads }: FunnelChartProps) {
  const steps = useMemo((): FunnelStep[] => {
    // Conta a partir dos leads DEDUPLICADOS (mesma base dos cards)
    const totalVisitantes = leads.length;
    const started = leads.filter((l) => l.eventos.some((e) => e.event_type === 'started_session')).length;
    const step1 = leads.filter((l) => l.cpf).length;
    const step2 = leads.filter((l) => l.whatsapp).length;
    const step3 = leads.filter((l) => l.perfil).length;
    const result = leads.filter((l) => l.eventos.some((e) => e.event_type === 'simulacao_result')).length;
    const compra = leads.filter((l) => l.eventos.some((e) => e.event_type === 'compra_enviada')).length;

    const maxCount = Math.max(totalVisitantes, 1);

    return [
      { label: 'Usuários Únicos', count: totalVisitantes, colorClass: 'bg-primary-500', bgClass: 'bg-background-800/50' },
      { label: 'Iniciou Atendimento', count: started, colorClass: 'bg-primary-400', bgClass: 'bg-background-800/50' },
      { label: 'Preencheu CPF', count: step1, colorClass: 'bg-accent-500', bgClass: 'bg-background-800/50' },
      { label: 'Informou WhatsApp', count: step2, colorClass: 'bg-accent-400', bgClass: 'bg-background-800/50' },
      { label: 'Escolheu Perfil', count: step3, colorClass: 'bg-secondary-500', bgClass: 'bg-background-800/50' },
      { label: 'Viu Resultado', count: result, colorClass: 'bg-secondary-400', bgClass: 'bg-background-800/50' },
      { label: 'Lead Qualificado', count: compra, colorClass: 'bg-amber-400', bgClass: 'bg-background-800/50' },
    ].map((s) => ({ ...s, pct: Math.round((s.count / maxCount) * 100) }));
  }, [leads]);

  return (
    <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-foreground-400 uppercase tracking-wider">Funil de Conversão</p>
          <p className="text-xs text-foreground-600 mt-1">De usuário único a lead qualificado</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
          <i className="ri-filter-line text-sm text-primary-400" />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const prevCount = idx > 0 ? steps[idx - 1].count : step.count;
          const conversion = idx > 0 && prevCount > 0
            ? Math.round((step.count / prevCount) * 100)
            : 100;
          const dropOff = idx > 0 ? 100 - conversion : 0;

          return (
            <div key={step.label} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground-300">{step.label}</span>
                <div className="flex items-center gap-2">
                  {idx > 0 && dropOff > 0 && (
                    <span className="text-[10px] text-red-400/70">
                      -{dropOff}%{' '}
                      <i className="ri-arrow-down-line text-[8px]" />
                    </span>
                  )}
                  <span className="text-sm font-bold text-foreground-100 tabular-nums">{step.count}</span>
                </div>
              </div>
              <div className={`h-3.5 rounded-full ${step.bgClass} overflow-hidden relative`}>
                <div
                  className={`h-full rounded-full ${step.colorClass} transition-all duration-700 ease-out`}
                  style={{ width: `${step.pct}%` }}
                />
                {idx > 0 && prevCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-[10px] font-medium text-foreground-400/60 tabular-nums">
                      {conversion}% conversão
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo do funil */}
      <div className="mt-5 pt-4 border-t border-background-700/30 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-primary-400 tabular-nums">{steps[0]?.count ?? 0}</p>
          <p className="text-[10px] text-foreground-600">Total de Visitas</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-accent-400 tabular-nums">{steps[6]?.count ?? 0}</p>
          <p className="text-[10px] text-foreground-600">Leads Qualificados</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-400 tabular-nums">
            {steps[0]?.count > 0 ? `${((steps[6].count / steps[0].count) * 100).toFixed(1)}%` : '0%'}
          </p>
          <p className="text-[10px] text-foreground-600">Taxa Global</p>
        </div>
      </div>
    </div>
  );
}