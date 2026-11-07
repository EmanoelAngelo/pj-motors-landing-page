import { useMemo } from 'react';
import type { LeadAgregado } from './Dashboard';

interface ProfileDonutProps {
  leads: LeadAgregado[];
}

interface Slice {
  perfil: string;
  count: number;
  color: string;
}

// Paleta HARMonICA e DISTINTA: usa 4 roles (primary/accent/secondary/foreground)
// em 3 niveis de luminosidade cada = 12 cores visualmente diferentes
// Mesmo que o tema seja esverdeado, a diferenca de luminosidade garante distincao
const PALETA = [
  'oklch(var(--primary-600))',        // verde medio-escuro
  'oklch(var(--accent-400))',         // verde-accent claro
  'oklch(var(--foreground-500))',     // cinza medio (quebra o verde)
  'oklch(var(--secondary-600))',      // verde-secondary medio-escuro
  'oklch(var(--primary-300))',        // verde bem claro
  'oklch(var(--accent-600))',         // verde-accent escuro
  'oklch(var(--foreground-400))',     // cinza claro
  'oklch(var(--secondary-300))',      // verde-secondary bem claro
  'oklch(var(--primary-700))',        // verde bem escuro
  'oklch(var(--accent-200))',         // verde-accent bem claro
  'oklch(var(--foreground-600))',     // cinza escuro
  'oklch(var(--secondary-700))',      // verde-secondary bem escuro
];

export default function ProfileDonut({ leads }: ProfileDonutProps) {
  const slices = useMemo((): Slice[] => {
    // So considera leads QUALIFICADOS (compra_enviada), usando leads DEDUPLICADOS
    const compras = leads.filter((l) => l.eventos.some((e) => e.event_type === 'compra_enviada'));
    const mapa = new Map<string, number>();

    for (const l of compras) {
      const perfil = l.perfil || 'Nao informado';
      mapa.set(perfil, (mapa.get(perfil) || 0) + 1);
    }

    const arr = Array.from(mapa.entries()).map(([perfil, count], i) => ({
      perfil,
      count,
      color: PALETA[i % PALETA.length],
    }));

    arr.sort((a, b) => b.count - a.count);
    return arr;
  }, [leads]);

  const total = slices.reduce((s, sl) => s + sl.count, 0);

  const cx = 50;
  const cy = 50;
  const rOut = 38;
  const rIn = 24;

  let currentAngle = -90;
  const paths: { path: string; color: string; label: string; count: number; pct: number }[] = [];

  for (const sl of slices) {
    const pct = total > 0 ? sl.count / total : 0;
    const angle = pct * 360;

    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = ((currentAngle + angle) * Math.PI) / 180;

    const x1 = cx + rOut * Math.cos(startRad);
    const y1 = cy + rOut * Math.sin(startRad);
    const x2 = cx + rOut * Math.cos(endRad);
    const y2 = cy + rOut * Math.sin(endRad);
    const x3 = cx + rIn * Math.cos(endRad);
    const y3 = cy + rIn * Math.sin(endRad);
    const x4 = cx + rIn * Math.cos(startRad);
    const y4 = cy + rIn * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    paths.push({ path, color: sl.color, label: sl.perfil, count: sl.count, pct: Math.round(pct * 100) });
    currentAngle += angle;
  }

  return (
    <div className="bg-background-900/60 border border-background-700/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-foreground-400 uppercase tracking-wider">Perfil dos Leads</p>
          <p className="text-xs text-foreground-600 mt-1">Quem mais esta convertendo</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center">
          <i className="ri-pie-chart-line text-sm text-secondary-400" />
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut SVG */}
        <svg width="140" height="140" viewBox="0 0 100 100" className="flex-shrink-0">
          {paths.map((p, i) => (
            <path key={i} d={p.path} fill={p.color} opacity={0.9} />
          ))}
          <text x={cx} y={cy - 3} fill="oklch(var(--foreground-100))" fontSize="16" fontWeight="bold" textAnchor="middle">
            {total}
          </text>
          <text x={cx} y={cy + 10} fill="oklch(var(--foreground-500))" fontSize="9" textAnchor="middle">
            leads
          </text>
        </svg>

        {/* Legenda */}
        <div className="flex-1 space-y-2 min-w-0">
          {paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* Quadrado de cor com border pra garantir visibilidade no fundo escuro */}
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0 border border-background-700/60"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-xs text-foreground-300 truncate flex-1 min-w-0" title={p.label}>{p.label}</span>
              <span className="text-xs font-bold text-foreground-100 tabular-nums flex-shrink-0">{p.count}</span>
              <span className="text-[10px] text-foreground-600 tabular-nums flex-shrink-0 w-8 text-right">{p.pct}%</span>
            </div>
          ))}
          {paths.length === 0 && (
            <p className="text-xs text-foreground-600">Nenhum lead qualificado ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}