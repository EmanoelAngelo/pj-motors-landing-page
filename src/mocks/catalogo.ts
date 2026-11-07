export interface Moto {
  id: string;
  nome: string;
  preco: string;
  precoNum: number;
  precoParcela: string;
  parcelaNum: number;
  imagem: string;
  velocidade: string;
  autonomia: string;
  potencia: string;
  tipo: string;
  destaque: string;
  videoUrl: string;
  descricao?: string;
}

const IMG_SUPRA = 'https://public.readdy.ai/ai/img_res/50947d1d-edd2-416a-8d31-bf3dcd69dce5.png';

const IMG_TRICICLO = 'https://public.readdy.ai/ai/img_res/c6395499-f77b-4bd9-988d-bc05912a18f4.png';

const IMG_MOBILETE = 'https://public.readdy.ai/ai/img_res/cece53e3-ff99-45cf-8e50-c0580448b300.png';

const IMG_BOLIN = 'https://public.readdy.ai/ai/img_res/62828233-352d-4f87-8501-a5a3cf7c83b0.png';

const IMG_TORINO = 'https://public.readdy.ai/ai/img_res/c7b2b085-7e9d-4c62-9f73-469c1a50958c.png';

const IMG_SANTORINI = 'https://public.readdy.ai/ai/img_res/38fff1f0-58d8-4496-9c37-d8d7c4d6e681.png';

const IMG_ULTRA_X = 'https://public.readdy.ai/ai/img_res/c96564b8-2de2-4975-91a0-c5f61ab76a1b.png';

const IMG_EAGLE = 'https://public.readdy.ai/ai/img_res/2b86be00-f0e4-43b3-8f53-91a729b85186.png';

const IMG_FAST = 'https://public.readdy.ai/ai/img_res/21769f58-a238-4018-a677-7b4ffa2fa2da.png';

const IMG_FREE_LIFE = 'https://public.readdy.ai/ai/img_res/4a4aa58c-43d1-4018-88d7-4be21998623b.png';

const IMG_WILZ = 'https://public.readdy.ai/ai/img_res/220a3040-0fc9-436b-ae97-1de8616ee40c.png';

const IMG_PATINETE = 'https://public.readdy.ai/ai/img_res/f4964904-b109-437d-9541-ae7398b120a4.png';

const IMG_CITY = 'https://public.readdy.ai/ai/img_res/5b22f5be-a3cf-41c8-989a-c73bf2b77a5e.png';

const IMG_CAPRI = 'https://public.readdy.ai/ai/img_res/d3a23be7-3d01-441e-ae3b-bd104e3ce47d.png';

export const motos: Moto[] = [
  {
    id: 'capri',
    nome: 'Capri',
    preco: 'R$ 11.900,00',
    precoNum: 11900,
    precoParcela: '18x de R$ 661,11',
    parcelaNum: 716,
    imagem: IMG_CAPRI,
    velocidade: '32 km/h',
    autonomia: 'até 80 km',
    potencia: '1000W',
    tipo: 'Moto Elétrica',
    destaque: 'Premium',
    videoUrl: 'https://youtube.com/embed/GoMpGqA5Z9s?feature=share',
    descricao: 'Moto elétrica premium com motor de 1000W e velocidade de 32 km/h. Autonomia de até 80 km com bateria de lítio 73V 24Ah. Partida no controle com alarme e NFC. Marcha a ré, amortecedor hidráulico e freio a disco hidráulico. Carregador bivolt, carregamento entre 5 e 8 horas. Suporta até 180 kg.',
  },
  {
    id: 'mobilete',
    nome: 'Mobilete',
    preco: 'R$ 11.900,00',
    precoNum: 11900,
    precoParcela: '18x de R$ 661,00',
    parcelaNum: 661,
    imagem: IMG_MOBILETE,
    velocidade: '32 km/h',
    autonomia: '40 a 50 km',
    potencia: '1000W',
    tipo: 'Moto Elétrica',
    destaque: 'RETRO',
    videoUrl: 'https://www.youtube.com/embed/GHBMov7jHxI',
    descricao: 'Moto elétrica retrô com motor de 1000W e velocidade de 32 km/h. Autonomia de 40 a 50 km com bateria de lítio 60V 20Ah. Partida no controle com alarme e NFC. Suporte para celular no guidão. Carregamento entre 5 e 8 horas. Design estilo retrô.',
  },
  {
    id: 'triciclo',
    nome: 'Triciclo',
    preco: 'R$ 11.900,00',
    precoNum: 11900,
    precoParcela: '18x de R$ 661,00',
    parcelaNum: 661,
    imagem: IMG_TRICICLO,
    velocidade: '32 km/h',
    autonomia: '25 a 30 km',
    potencia: '1000W',
    tipo: 'Triciclo Elétrico',
    destaque: 'CARGA',
    videoUrl: 'https://www.youtube.com/embed/pn6A5eumUUg',
    descricao: 'Triciclo elétrico com motor de 1000W e velocidade de 32 km/h. Autonomia de 25 a 30 km com bateria de lítio 48V 12A (fixa, não removível). Partida por cartão de aproximação e pulseira NFC. Freio a disco dianteiro. Carregamento entre 5 e 8 horas. Carregador bivolt.',
  },
  {
    id: 'supra',
    nome: 'Supra',
    preco: 'R$ 12.900,00',
    precoNum: 12900,
    precoParcela: '18x de R$ 716,00',
    parcelaNum: 716,
    imagem: IMG_SUPRA,
    velocidade: '32 km/h',
    autonomia: '40 a 50 km',
    potencia: '1000W',
    tipo: 'Moto Elétrica',
    destaque: 'Top de Linha',
    videoUrl: 'https://www.youtube.com/embed/4OB_mj9ZgjI',
    descricao: 'Moto elétrica top de linha com motor de 1000W e velocidade de 32 km/h. Autonomia de 40 a 50 km com bateria de lítio 60V 20Ah. Partida no controle com alarme e NFC. Suporte para celular no guidão. Carregamento entre 5 e 8 horas.',
  },
  {
    id: 'bolin',
    nome: 'Bolin',
    preco: 'R$ 12.900,00',
    precoNum: 12900,
    precoParcela: '18x de R$ 716,00',
    parcelaNum: 716,
    imagem: IMG_BOLIN,
    velocidade: '32 km/h',
    autonomia: '40 a 50 km',
    potencia: '1000W',
    tipo: 'Moto Elétrica',
    destaque: 'Compacta',
    videoUrl: 'https://www.youtube.com/embed/3I-81TWIs5c',
    descricao: 'Moto elétrica compacta com motor de 1000W e velocidade de 32 km/h. Autonomia de 40 a 50 km com bateria de lítio 60V 20Ah. Partida no controle com alarme e NFC. Suporte para celular no guidão. Carregamento entre 5 e 8 horas.',
  },
  {
    id: 'torino',
    nome: 'Torino',
    preco: 'R$ 9.900,00',
    precoNum: 9900,
    precoParcela: '18x de R$ 605,00',
    parcelaNum: 605,
    imagem: IMG_TORINO,
    velocidade: '32 km/h',
    autonomia: '40 a 50 km',
    potencia: '1000W',
    tipo: 'Scooter Elétrica',
    destaque: 'Elegante',
    videoUrl: 'https://www.youtube.com/embed/0_S38aYWnjA',
    descricao: 'Scooter elétrica com motor de 1000W e velocidade de 32 km/h. Autonomia de 40 a 50 km com bateria de lítio 60V 20Ah removível. Partida no controle com alarme. Freio a disco (upgrade). Carregamento entre 5 e 8 horas. Suporta até 120 kg.',
  },
  {
    id: 'santorini-r9',
    nome: 'Santorini R9',
    preco: 'R$ 9.900,00',
    precoNum: 9900,
    precoParcela: '18x de R$ 605,00',
    parcelaNum: 605,
    imagem: IMG_SANTORINI,
    velocidade: '32 km/h',
    autonomia: '30 a 40 km',
    potencia: '1000W',
    tipo: 'E-bike Elétrica',
    destaque: 'Premium',
    videoUrl: 'https://www.youtube.com/embed/sea2cKFwpNo',
    descricao: 'E-bike elétrica premium com motor de 750W e velocidade de 32 km/h. Autonomia de 30 a 40 km com bateria de lítio 48V 15Ah. Pedal assistido com 7 velocidades e câmbio Shimano Tourney. Quadro em aço carbono com freio a disco. Carregamento entre 5 e 8 horas. Suporta até 120 kg.',
  },
  {
    id: 'ultra-x',
    nome: 'Ultra X',
    preco: 'R$ 9.400,00',
    precoNum: 9400,
    precoParcela: '18x de R$ 522,00',
    parcelaNum: 522,
    imagem: IMG_ULTRA_X,
    velocidade: '32 km/h',
    autonomia: '40 a 50 km',
    potencia: '1000W',
    tipo: 'Moto Elétrica',
    destaque: 'Estilo Harley',
    videoUrl: 'https://www.youtube.com/embed/gluMQ5nUShY',
    descricao: 'Moto elétrica estilo Harley com motor de 1000W e velocidade de 32 km/h. Autonomia de 40 a 50 km com bateria de lítio 60V 12Ah. Partida no controle com alarme. Freio a disco. Carregamento entre 5 e 8 horas. Suporta até 150 kg.',
  },
  {
    id: 'eagle',
    nome: 'Eagle',
    preco: 'R$ 8.900,00',
    precoNum: 8900,
    precoParcela: '18x de R$ 494,00',
    parcelaNum: 494,
    imagem: IMG_EAGLE,
    velocidade: '32 km/h',
    autonomia: '40 a 50 km',
    potencia: '1000W',
    tipo: 'Moto Elétrica',
    destaque: 'AVENTURA',
    videoUrl: 'https://www.youtube.com/embed/v-5vz5HV2Ws',
    descricao: 'Moto elétrica com motor de 1000W e velocidade de 32 km/h. Autonomia de 40 a 50 km com bateria de lítio 60V 20Ah removível. Partida no controle com alarme. Pedal assistido e freio a disco. Carregamento entre 5 e 8 horas. Suporta até 120 kg.',
  },
  {
    id: 'city',
    nome: 'City',
    preco: 'R$ 2.999,00',
    precoNum: 2999,
    precoParcela: '18x de R$ 199,00',
    parcelaNum: 199,
    imagem: IMG_CITY,
    velocidade: '32 km/h',
    autonomia: '40 a 50 km',
    potencia: '500W',
    tipo: 'Moto Elétrica',
    destaque: 'Entrada',
    videoUrl: 'https://www.youtube.com/embed/tKgsKB7dcr0',
    descricao: 'Moto elétrica compacta com motor de 500W e velocidade de 32 km/h. Autonomia de 40 a 50 km com bateria de lítio 60V 20Ah. Partida no controle com alarme e NFC. Carregamento entre 5 e 8 horas. Suporte para celular no guidão.',
  },
  {
    id: 'free-life',
    nome: 'Free Life',
    preco: 'R$ 6.900,00',
    precoNum: 6900,
    precoParcela: '18x de R$ 405,00',
    parcelaNum: 405,
    imagem: IMG_FREE_LIFE,
    velocidade: '32 km/h',
    autonomia: '25 a 30 km',
    potencia: '1000W',
    tipo: 'Scooter Elétrica',
    destaque: 'Híbrida',
    videoUrl: 'https://www.youtube.com/embed/_EUCoDB5uSg',
    descricao: 'Moto elétrica híbrida com motor de 1000W e velocidade de 32 km/h. Autonomia de 25 a 30 km com bateria de lítio 48V 12A. Partida por cartão de aproximação e pulseira NFC. Pedal assistido com 3 velocidades. Freio a disco dianteiro. Carregamento entre 5 e 8 horas. Suporta até 150 kg.',
  },
  {
    id: 'patinete-street',
    nome: 'Patinete Street',
    preco: 'R$ 3.500,00',
    precoNum: 3500,
    precoParcela: '18x de R$ 194,00',
    parcelaNum: 194,
    imagem: IMG_PATINETE,
    velocidade: '32 km/h',
    autonomia: 'até 35 km',
    potencia: '500W',
    tipo: 'Patinete Elétrico',
    destaque: 'Urbano',
    videoUrl: 'https://www.youtube.com/embed/O5dlbVRuKU8',
    descricao: 'Patinete elétrico com motor de 500W e velocidade de 32 km/h. Autonomia de até 35 km com bateria de lítio 48V 10.4Ah. Quadro de alumínio com freio a disco. Pneu maciço de 10 polegadas. Carregamento em até 5 horas. Suporta até 150 kg.',
  },
  {
    id: 'fast',
    nome: 'Fast',
    preco: 'R$ 6.900,00',
    precoNum: 6900,
    precoParcela: '18x de R$ 383,00',
    parcelaNum: 383,
    imagem: IMG_FAST,
    velocidade: '32 km/h',
    autonomia: '35 a 45 km',
    potencia: '500W',
    tipo: 'Scooter Elétrica',
    destaque: 'ÁGIL',
    videoUrl: 'https://www.youtube.com/embed/AQUki9lHAqI',
    descricao: 'Scooter elétrica com motor de 500W e velocidade de 32 km/h. Autonomia de 35 a 45 km com bateria de lítio 48V 20Ah. Partida no controle com alarme. Carregamento entre 5 e 8 horas. Suporta até 120 kg.',
  },
  {
    id: 'wilz',
    nome: 'Wilz',
    preco: 'R$ 5.900,00',
    precoNum: 5900,
    precoParcela: '18x de R$ 327,00',
    parcelaNum: 327,
    imagem: IMG_WILZ,
    velocidade: '32 km/h',
    autonomia: '35 a 40 km',
    potencia: '800W',
    tipo: 'Scooter Elétrica',
    destaque: 'Econômica',
    videoUrl: 'https://www.youtube.com/embed/1T6whbYt0bM',
    descricao: 'Scooter elétrica com motor de 800W e velocidade de 32 km/h. Autonomia de 35 a 40 km com bateria de lítio 60V 20Ah. Partida no controle com alarme e NFC. Carregamento entre 5 e 8 horas. Carregador bivolt.',
  },
];

// Linha de cima: 8 Premium
export const linhaCima = motos.slice(0, 8);

// Linha de baixo: 6 Econômica
export const linhaBaixo = motos.slice(8, 14);

export const WPP_NUMERO = '5553981335800';

export function montarMensagemWhatsApp(
  nome: string,
  cpf: string,
  cidade: string,
  whatsapp: string,
  perfilLabel: string,
  moto?: Moto,
  tipoCompra?: 'avista' | 'financiado',
  endereco?: string,
  cep?: string,
  dataNascimento?: string,
): string {
  const base = `*NOVO PEDIDO - PJ MOTORS*%0A%0A`;
  const cliente = `*Dados do Cliente:*%0A• Nome: ${nome}%0A• CPF: ${cpf}%0A• WhatsApp: ${whatsapp}%0A`;

  let dadosExtras = '';
  if (endereco) dadosExtras += `• Endereço: ${endereco}%0A`;
  if (cep) dadosExtras += `• CEP: ${cep}%0A`;
  if (dataNascimento) dadosExtras += `• Data de Nascimento: ${dataNascimento}%0A`;

  if (moto && tipoCompra === 'avista') {
    return `${base}${cliente}${dadosExtras}%0A*Compra à Vista*%0A• Modelo: ${moto.nome}%0A• Valor: ${moto.preco}%0A`;
  }

  if (moto && tipoCompra === 'financiado') {
    return `${base}${cliente}${dadosExtras}%0A*Compra Financiada*%0A• Modelo: ${moto.nome}%0A• Condição: ${perfilLabel}%0A%0A⚠️ Valores serão informados na etapa de atendimento.%0A`;
  }

  return `${base}${cliente}${dadosExtras}%0A*Perfil:* ${perfilLabel}%0A`;
}

export function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatarParcela(qtdParcelas: number, valorParcela: number): string {
  return `${qtdParcelas}x de ${formatarMoeda(valorParcela)}`;
}

export function montarMensagemWhatsAppV2(
  nome: string,
  cpf: string,
  cidade: string,
  whatsapp: string,
  perfilLabel: string,
  moto?: Moto,
  tipoCompra?: 'avista' | 'financiado' | 'cartao',
  bandeira?: string,
  parcelas?: number | null,
  endereco?: string,
  cep?: string,
  dataNascimento?: string,
): string {
  const base = `*NOVO PEDIDO - PJ MOTORS*%0A%0A`;
  const cliente = `*Dados do Cliente:*%0A• Nome: ${nome}%0A• CPF: ${cpf}%0A• WhatsApp: ${whatsapp}%0A`;

  let dadosExtras = '';
  if (endereco) dadosExtras += `• Endereço: ${endereco}%0A`;
  if (cep) dadosExtras += `• CEP: ${cep}%0A`;
  if (dataNascimento) dadosExtras += `• Data de Nascimento: ${dataNascimento}%0A`;

  let pagamentoInfo = '';
  if (tipoCompra === 'avista') {
    pagamentoInfo = `*Pagamento:* À Vista%0A`;
  } else if (tipoCompra === 'cartao' && bandeira && parcelas) {
    pagamentoInfo = `*Pagamento:* Cartão de Crédito%0A• Bandeira: ${bandeira}%0A• Parcelas: ${parcelas}x%0A`;
  } else if (tipoCompra === 'financiado') {
    pagamentoInfo = `*Pagamento:* Financiado%0A• Condição: ${perfilLabel}%0A%0A⚠️ Valores serão informados na etapa de atendimento.%0A`;
  }

  if (moto) {
    if (tipoCompra === 'financiado') {
      return `${base}${cliente}${dadosExtras}%0A*Produto:*%0A• Modelo: ${moto.nome}%0A%0A${pagamentoInfo}`;
    }
    return `${base}${cliente}${dadosExtras}%0A*Produto:*%0A• Modelo: ${moto.nome}%0A• Valor: ${moto.preco}%0A• Parcela sugerida: ${moto.precoParcela}%0A%0A${pagamentoInfo}`;
  }

  return `${base}${cliente}${dadosExtras}%0A${pagamentoInfo}`;
}