import { Utensils, Stethoscope, Landmark, ShoppingBag, Building2, Bath, GraduationCap, Bus, Hotel } from 'lucide-react';
import type { EstablishmentCategory } from '../types';

export const MAP_CATEGORIES = {
  alimentacao: { label: 'Alimentação', color: '#c2410c', icon: Utensils, types: ['restaurant', 'cafe', 'bakery', 'bar'] },
  saude: { label: 'Saúde & Clínicas', color: '#0369a1', icon: Stethoscope, types: ['hospital', 'pharmacy', 'doctor', 'dentist'] },
  lazer_cultura: { label: 'Lazer & Cultura', color: '#7e22ce', icon: Landmark, types: ['park', 'museum', 'movie_theater', 'tourist_attraction'] },
  comercio_loja: { label: 'Comércio & Lojas', color: '#047857', icon: ShoppingBag, types: ['supermarket', 'shopping_mall', 'store'] },
  servico_publico: { label: 'Serviço Público', color: '#334155', icon: Building2, types: ['city_hall', 'post_office', 'police', 'courthouse'] },
  banheiro_adaptado: { label: 'Banheiros (adaptação a verificar)', color: '#0e7490', icon: Bath, types: ['public_bathroom'] },
  educacao: { label: 'Educação', color: '#a16207', icon: GraduationCap, types: ['school', 'university', 'library'] },
  transporte_mobilidade: { label: 'Transporte', color: '#be185d', icon: Bus, types: ['bus_station', 'transit_station', 'train_station'] },
  hospedagem: { label: 'Hospedagem', color: '#4338ca', icon: Hotel, types: ['hotel', 'lodging'] },
} satisfies Record<EstablishmentCategory, { label: string; color: string; icon: typeof Utensils; types: string[] }>;

export function categoryForTypes(types: string[]): EstablishmentCategory {
  // Match specific services before broad types such as store.
  const order: EstablishmentCategory[] = ['saude', 'alimentacao', 'banheiro_adaptado', 'educacao', 'hospedagem', 'transporte_mobilidade', 'lazer_cultura', 'servico_publico', 'comercio_loja'];
  return order.find(category => MAP_CATEGORIES[category].types.some(type => types.includes(type))) ?? 'comercio_loja';
}
