import { useMemo, useState, useCallback, useRef } from 'react';
import type { LeadAgregado } from './Dashboard';

interface ConversionGaugeProps {
  leads: LeadAgregado[];
}

const GAUGE_MAX_PERCENT = 20; // arco vai de 0% a 20%+
const META_MIN = 1;
const META_MAX = 20;

export default function ConversionGauge({ leads }: ConversionGaugeProps) {
  const [metaPercent, setMetaPercent] = useState(() => {
    const saved = localStorage.getItem('pj_motors_meta_percent');
    return saved ? Math.max(META_MIN, Math.min(META_MAX, parseInt(saved, 10))) : 11;
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);

  // Persiste meta no localStorage
  const updateMeta = useCallback((value: number | ((prev: number) => number)) => {
    setMetaPercent((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      const clamped = Math.max(META_MIN, Math.min(META_MAX, next));
      localStorage.setItem('pj_motors_meta_percent', String(clamped));
      return clamped;
    });
  }, []);

  const radius = 80;
  const strokeWidth = 14;
  const centerX = 100;
  const centerY = 85;
  const circumference = Math.PI * radius;

  const { percent, totalVisitas, totalLeads, metaLeads, faltam, metaAtingida } = useMemo(() => {
    const totalVisitas = leads.length;
    const totalLeads = leads.filter((l) => l.eventos.some((e) => e.event_type === 'compra_enviada')).length;
    const pct = totalVisitas > 0 ? (totalLeads / totalVisitas) * 100 : 0;

    // Calculo automatico: metaPercent% dos visitantes = quantos leads preciso?
    const _metaLeads = totalVisitas > 0 ? Math.max(1, Math.ceil((metaPercent / 100) * totalVisitas)) : 0;
    const _faltam = Math.max(0, _metaLeads - totalLeads);
    const _metaAtingida = totalLeads >= _metaLeads && _metaLeads > 0;

    return {
      percent: pct,
      totalVisitas,
      totalLeads,
      metaLeads: _metaLeads,
      faltam: _faltam,
      metaAtingida: _metaAtingida,
    };
  }, [leads, metaPercent]);

  // Converte coordenadas do mouse pra angulo e metaPercent
  const mouseToMetaPercent = useCallback(
    (clientX: number, clientY: number): number => {
      const svg = svgRef.current;
      if (!svg) return metaPercent;
      const rect = svg.getBoundingClientRect();
      const scaleX = 200 / rect.width;
      const scaleY = 140 / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;
      const dx = mx - centerX;
      const dy = my - centerY;

      let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angleDeg < 0) angleDeg += 360;
      angleDeg = Math.max(180, Math.min(360, angleDeg));
      const ratio = (angleDeg - 180) / 180;
      return Math.max(META_MIN, Math.min(META_MAX, Math.round(ratio * GAUGE_MAX_PERCENT)));
    },
    [metaPercent],
  );

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;

    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      updateMeta(mouseToMetaPercent(ev.clientX, ev.clientY));
    };

    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [mouseToMetaPercent]);

  // Touch support
  const startDragTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;

    const onMove = (ev: TouchEvent) => {
      if (!draggingRef.current || !ev.touches[0]) return;
      updateMeta(mouseToMetaPercent(ev.touches[0].clientX, ev.touches[0].clientY));
    };

    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [mouseToMetaPercent]);

  // Proporcao em relacao ao maximo do gauge (0-20%)
  const ratio = Math.min(percent / GAUGE_MAX_PERCENT, 1);

  // Ponteiro (conversao real)
  const pointerAngleDeg = 180 + ratio * 180;
  const pointerRad = (pointerAngleDeg * Math.PI) / 180;
  const pointerLen = radius - 6;
  const pointerX = centerX + pointerLen * Math.cos(pointerRad);
  const pointerY = centerY + pointerLen * Math.sin(pointerRad);

  // Marcador de meta (draggable)
  const metaRatio = Math.min(metaPercent / GAUGE_MAX_PERCENT, 1);
  const metaAngleDeg = 180 + metaRatio * 180;
  const metaRad = (metaAngleDeg * Math.PI) / 180;

  // Bolinha da meta
  const metaDotR = 5;
  const metaDotDistance = radius + 10;
  const metaDotX = centerX + metaDotDistance * Math.cos(metaRad);
  const metaDotY = centerY + metaDotDistance * Math.sin(metaRad);

  // Area de hit maior pra facilitar o drag (invisivel)
  const hitR = 16;

  // Cores e classificacoes — dinamicas, proporcionais a meta
  const getStatus = (p: number, meta: number): { color: string; label: string } => {
    if (p >= meta) return { color: 'oklch(var(--accent-500))', label: 'Cumpriu a meta!' };
    if (p >= meta * 0.5) return { color: 'oklch(var(--accent-400))', label: 'No ritmo' };
    if (p >= meta * 0.25) return { color: 'oklch(var(--secondary-500))', label: 'Média' };
    return { color: 'oklch(var(--primary-500))', label: 'Fraco' };
  };

  const statusAtual = useMemo(() => getStatus(percent, metaPercent), [percent, metaPercent]);

  // Tick marks
  const tickValues = [
    { label: '0%', pct: 0 },
    { label: '5%', pct: 5 },
    { label: '10%', pct: 10 },
    { label: '15%', pct: 15 },
  ];

  return (
    <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-foreground-400 uppercase tracking-wider">Termômetro da Campanha</p>
          <p className="text-[11px] text-foreground-600 mt-0.5">
            Ajuste a meta arrastando a bolinha
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
          <i className="ri-dashboard-3-line text-sm text-accent-400" />
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* SVG com suporte a drag — responsivo */}
        <svg
          ref={svgRef}
          className="overflow-visible select-none w-[180px] h-[135px] sm:w-[200px] sm:h-[150px]"
          viewBox="0 0 200 150"
        >
          {/* Arco de fundo */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="oklch(var(--background-800))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Arco colorido — preenche da esquerda (0%) pra direita (20%+) */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke={getStatus(percent, metaPercent).color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - ratio * circumference}
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
          />

          {/* Tick marks intermediarios */}
          {tickValues.map((tick) => {
            const tickRatio = tick.pct / GAUGE_MAX_PERCENT;
            const tickAngleDeg = 180 + tickRatio * 180;
            const tickRad = (tickAngleDeg * Math.PI) / 180;
            const innerR = radius - strokeWidth / 2 - 1;
            const outerR = radius + strokeWidth / 2 + 6;
            const tx1 = centerX + innerR * Math.cos(tickRad);
            const ty1 = centerY + innerR * Math.sin(tickRad);
            const tx2 = centerX + outerR * Math.cos(tickRad);
            const ty2 = centerY + outerR * Math.sin(tickRad);
            return (
              <g key={tick.label}>
                <line
                  x1={tx1} y1={ty1} x2={tx2} y2={ty2}
                  stroke="oklch(var(--foreground-600))"
                  strokeWidth={1}
                />
                <text
                  x={centerX + (outerR + 10) * Math.cos(tickRad)}
                  y={centerY + (outerR + 10) * Math.sin(tickRad)}
                  fill="oklch(var(--foreground-600))"
                  fontSize="9"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Linha tracejada da meta ate o centro */}
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + (radius - 4) * Math.cos(metaRad)}
            y2={centerY + (radius - 4) * Math.sin(metaRad)}
            stroke="oklch(var(--accent-500))"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.5}
          />

          {/* Area de hit invisivel pro drag (maior que a bolinha) */}
          <circle
            cx={metaDotX}
            cy={metaDotY}
            r={hitR}
            fill="transparent"
            stroke="transparent"
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={startDrag}
            onTouchStart={startDragTouch}
          />

          {/* Bolinha da meta — visual (menor, dentro da area de hit) */}
          <circle
            cx={metaDotX}
            cy={metaDotY}
            r={metaDotR}
            fill="oklch(var(--accent-500))"
            stroke="oklch(var(--background-900))"
            strokeWidth={2}
            className="cursor-grab active:cursor-grabbing"
            onMouseDown={startDrag}
            onTouchStart={startDragTouch}
            style={{ transition: draggingRef.current ? 'none' : 'all 0.15s ease' }}
          />

          {/* Label da meta */}
          <text
            x={metaDotX}
            y={metaDotY - 13}
            fill="oklch(var(--accent-400))"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
            className="pointer-events-none"
          >
            {metaPercent}%
          </text>

          {/* Ponteiro (conversao real) */}
          <line
            x1={centerX}
            y1={centerY}
            x2={pointerX}
            y2={pointerY}
            stroke="oklch(var(--foreground-200))"
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ transition: 'all 0.8s ease-out' }}
          />
          {/* Centro do ponteiro */}
          <circle cx={centerX} cy={centerY} r={5} fill="oklch(var(--background-900))" stroke="oklch(var(--foreground-300))" strokeWidth={2} />

          {/* Labels nas pontas */}
          <text x={centerX - radius - 4} y={centerY + 4} fill="oklch(var(--foreground-500))" fontSize="11" textAnchor="middle">0%</text>
          <text x={centerX + radius + 4} y={centerY + 4} fill="oklch(var(--foreground-500))" fontSize="11" textAnchor="middle">{GAUGE_MAX_PERCENT}%+</text>
        </svg>

        {/* Ajuste fino com botoes +/- */}
        <div className="flex items-center gap-2 mt-1 mb-1">
          <button
            onClick={() => updateMeta((p) => Math.max(META_MIN, p - 1))}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-background-800 text-foreground-500 hover:text-foreground-300 hover:bg-background-700 transition-colors cursor-pointer"
          >
            <i className="ri-subtract-line text-xs" />
          </button>
          <span className="text-xs font-medium text-accent-400 w-16 text-center">
            Meta: {metaPercent}%
          </span>
          <button
            onClick={() => updateMeta((p) => Math.min(META_MAX, p + 1))}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-background-800 text-foreground-500 hover:text-foreground-300 hover:bg-background-700 transition-colors cursor-pointer"
          >
            <i className="ri-add-line text-xs" />
          </button>
        </div>

        {/* Percentual de conversao atual */}
        <p className="text-3xl font-bold mt-1" style={{ color: getStatus(percent, metaPercent).color }}>
          {percent.toFixed(1)}%
        </p>
        <p className="text-xs font-medium mt-0.5" style={{ color: getStatus(percent, metaPercent).color }}>
          {getStatus(percent, metaPercent).label}
        </p>

        {/* Legenda de cores — dinamica conforme a meta, responsiva */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'oklch(var(--primary-500))' }} />
            <span className="text-[10px] text-foreground-600">
              &lt; {Math.max(1, Math.round(metaPercent * 0.25))}% fraco
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'oklch(var(--secondary-500))' }} />
            <span className="text-[10px] text-foreground-600">
              {Math.max(1, Math.round(metaPercent * 0.25))}–{Math.round(metaPercent * 0.5)}% média
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'oklch(var(--accent-400))' }} />
            <span className="text-[10px] text-foreground-600">
              {Math.round(metaPercent * 0.5)}–{metaPercent}% no ritmo
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'oklch(var(--accent-500))' }} />
            <span className="text-[10px] text-foreground-600">
              {metaPercent}%+ cumpriu
            </span>
          </div>
        </div>

        {/* Box com os numeros da meta */}
        <div className="mt-3 w-full bg-background-800/40 border border-background-700/30 rounded-lg p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div>
              <p className="text-[9px] sm:text-[10px] text-foreground-600 uppercase tracking-wider">Visitantes</p>
              <p className="text-base sm:text-lg font-bold text-foreground-200">{totalVisitas}</p>
            </div>
            <div className="border-l border-r border-background-700/30">
              <p className="text-[9px] sm:text-[10px] text-foreground-600 uppercase tracking-wider">Leads atuais</p>
              <p className="text-base sm:text-lg font-bold text-primary-400">{totalLeads}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-foreground-600 uppercase tracking-wider">Meta ({metaPercent}%)</p>
              <p className={`text-base sm:text-lg font-bold ${metaAtingida ? 'text-accent-400' : 'text-foreground-300'}`}>
                {metaLeads}
              </p>
            </div>
          </div>

          {/* Barra de progresso visual */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-foreground-600 mb-1">
              <span>Progresso</span>
              <span>{totalLeads}/{metaLeads} leads</span>
            </div>
            <div className="w-full h-2 rounded-full bg-background-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  metaAtingida
                    ? 'bg-accent-500'
                    : totalLeads / Math.max(metaLeads, 1) >= metaPercent * 0.5 / 100
                      ? 'bg-accent-400'
                      : totalLeads / Math.max(metaLeads, 1) >= metaPercent * 0.25 / 100
                        ? 'bg-secondary-500'
                        : 'bg-primary-500'
                }`}
                style={{ width: `${Math.min(100, (totalLeads / Math.max(metaLeads, 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Mensagem de status */}
          {!metaAtingida && metaLeads > 0 && (
            <p className="text-xs text-foreground-500 mt-2 text-center">
              Faltam{' '}
              <span className="text-accent-400 font-semibold">{faltam} leads</span>
              {' '}para bater a meta de {metaPercent}%
              {totalVisitas > 0 && (
                <span className="text-foreground-600">
                  {' '}&middot; precisa de mais{' '}
                  <span className="text-foreground-400 font-medium">
                    {Math.max(0, Math.ceil((metaPercent / 100) * totalVisitas) - totalVisitas)}
                  </span>{' '}
                  visitantes se a conversão atual se mantiver
                </span>
              )}
            </p>
          )}
          {metaAtingida && metaLeads > 0 && (
            <p className="text-xs text-accent-400 mt-2 text-center font-medium">
              Meta de {metaPercent}% ({metaLeads} leads) atingida!{' '}
              {totalLeads > metaLeads && (
                <span className="text-accent-300">Superou em {totalLeads - metaLeads} leads.</span>
              )}
            </p>
          )}
          {totalVisitas === 0 && (
            <p className="text-xs text-foreground-600 mt-2 text-center">
              Aguardando primeiros visitantes...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}