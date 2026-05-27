import { Property } from './types';

// Imagem neutra usada apenas quando o anunciante ainda não enviou fotos reais.
// Não representa imóvel disponível para locação.
export const PLACEHOLDER_IMAGE = '/sem-foto-imovel.png';

// Não mantenha imóveis fictícios em produção. A lista inicial deve começar vazia.
export const DEFAULT_PROPERTIES: Property[] = [];

export const ALL_AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi', category: 'Conectividade' },
  { id: 'piscina', label: 'Piscina', category: 'Lazer' },
  { id: 'churrasqueira', label: 'Churrasqueira', category: 'Lazer' },
  { id: 'ar_condicionado', label: 'Ar Condicionado', category: 'Conforto' },
  { id: 'mobiliado', label: 'Mobiliado', category: 'Praticidade' },
  { id: 'garagem', label: 'Vaga de Garagem', category: 'Praticidade' },
  { id: 'pet_friendly', label: 'Aceita Pets', category: 'Regras' },
  { id: 'frente_mar', label: 'Frente ao Mar', category: 'Localização' },
  { id: 'banheira_hidro', label: 'Banheira/Hidro', category: 'Conforto' },
  { id: 'academia', label: 'Academia no Condomínio', category: 'Lazer' },
  { id: 'jardim', label: 'Quintal / Jardim', category: 'Espaço' }
];

export const STATES_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const POPULAR_IMAGES = [
  {
    url: PLACEHOLDER_IMAGE,
    label: 'Sem foto — envie imagens reais do imóvel',
    category: 'placeholder'
  }
];
