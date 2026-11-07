export const cidades = [
  'Santa Maria',
  'Pelotas',
  'Passo Fundo',
  'Rio Grande',
  'Lajeado',
];

export interface PerfilOption {
  id: string;
  label: string;
  sublabel: string;
  categoria: 'sem_entrada' | 'outras' | 'bloqueado';
  aprovado: boolean;
}

export const perfis: PerfilOption[] = [
  {
    id: 'clt',
    label: 'Carteira Assinada',
    sublabel: 'CLT com mais de 9 meses',
    categoria: 'sem_entrada',
    aprovado: true,
  },
  {
    id: 'aposentado',
    label: 'Aposentado',
    sublabel: 'Aposentadoria confirmada',
    categoria: 'sem_entrada',
    aprovado: true,
  },
  {
    id: 'pensionista',
    label: 'Pensionista',
    sublabel: 'Recebe pensão por morte',
    categoria: 'sem_entrada',
    aprovado: true,
  },
  {
    id: 'negativado_clt',
    label: 'Negativado com CLT',
    sublabel: 'CLT com mais de 9 meses',
    categoria: 'sem_entrada',
    aprovado: true,
  },
  {
    id: 'boleto_50',
    label: '50% de Entrada',
    sublabel: 'Pagamento via boleto',
    categoria: 'outras',
    aprovado: true,
  },
  {
    id: 'cartao',
    label: 'Cartão de Crédito',
    sublabel: 'Até 18x sem juros',
    categoria: 'outras',
    aprovado: true,
  },
  {
    id: 'nenhum',
    label: 'NENHUM DESSES',
    sublabel: 'Não me enquadro nas opções',
    categoria: 'bloqueado',
    aprovado: false,
  },
];

export interface SimulacaoData {
  nome: string;
  cidade: string;
  whatsapp: string;
  perfilId: string;
  perfilLabel: string;
  status: 'aprovado' | 'recusado';
  timestamp: string;
}