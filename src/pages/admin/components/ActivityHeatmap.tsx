import { useMemo } from 'react';
import type { LeadEvent, LeadAgregado } from './Dashboard';

interface ActivityHeatmapProps {
  events: LeadEvent[];
  leads: LeadAgregado[];
}

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ActivityHeatmap({ events, leads }: ActivityHeatmapProps) {
  const hoje = useMemo(() => new Date(), []);

  const dias = useMemo(() => {
    const arr: { label: string; data: string; count: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
      const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const fim = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const dayEvents = events.filter((e) => {
        const t = new Date(e.created_at).getTime();
        return t >= inicio.getTime() && t < fim.getTime();
      });

      arr.push({
        label: i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : DIAS_PT[d.getDay()],
        data: d.toISOString().split('T')[0],
        count: dayEvents.length,
      });
    }

    return arr;
  }, [events, hoje]);

  const totalEventosSemana = dias.reduce((s, d) => s + d.count, 0);

  // Resumos consistentes com os cards (usando leads deduplicados)
  const resumos = useMemo(() => {
    const inicioSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6);
    const fimSemana = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);

    // Leads ativos nesta semana que AINDA NÃO tinham convertido antes
    // (exclui quem já era lead qualificado de semanas anteriores)
    const leadsNaSemana = leads.filter((l) => {
      const temEventoNaSemana = l.eventos.some((e) => {
        const t = new Date(e.created_at).getTime();
        return t >= inicioSemana.getTime() && t < fimSemana.getTime();
      });
      const converteuAntes = l.eventos.some((e) => {
        const t = new Date(e.created_at).getTime();
        return e.event_type === 'compra_enviada' && t < inicioSemana.getTime();
      });
      return temEventoNaSemana && !converteuAntes;
    });

    const qualificadosNaSemana = leads.filter((l) =>
      l.eventos.some((e) => {
        const t = new Date(e.created_at).getTime();
        return e.event_type === 'compra_enviada' && t >= inicioSemana.getTime() && t < fimSemana.getTime();
      })
    );

    const taxa = leadsNaSemana.length > 0
      ? ((qualificadosNaSemana.length / leadsNaSemana.length) * 100).toFixed(1)
      : '0.0';

    return {
      leadsAtivos: leadsNaSemana.length,
      qualificados: qualificadosNaSemana.length,
      taxa,
    };
  }, [leads, hoje]);

  return (
    <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground-400 uppercase tracking-wider">Resumo da Semana</p>
          <p className="text-xs text-foreground-600 mt-1">Dados consolidados dos últimos 7 dias</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
          <i className="ri-fire-line text-sm text-primary-400" />
        </div>
      </div>

      {/* Lista de dias com contagem */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {dias.map((dia) => (
          <div key={dia.data} className="text-center">
            <div className="text-[10px] text-foreground-500 mb-1">{dia.label}</div>
            <div className={`text-sm font-bold tabular-nums ${dia.count > 0 ? 'text-foreground-200' : 'text-foreground-700'}`}>
              {dia.count}
            </div>
            <div className="text-[9px] text-foreground-600">eventos</div>
          </div>
        ))}
      </div>

      {/* Resumo da semana — números consistentes com os cards */}
      <div className="mt-4 pt-4 border-t border-background-700/30 grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-primary-400 tabular-nums">{totalEventosSemana}</p>
          <p className="text-[10px] text-foreground-600">Eventos na semana</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-accent-400 tabular-nums">{resumos.qualificados}</p>
          <p className="text-[10px] text-foreground-600">Leads qualificados</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-400 tabular-nums">{resumos.taxa}%</p>
          <p className="text-[10px] text-foreground-600">Taxa de conversão (7d)</p>
        </div>
      </div>
    </div>
  );
}