export type DiscountType = 'fixed' | 'percentage' | 'promo';

export type SectionType = 
  | 'general'
  | 'carnisseria'
  | 'peixateria'
  | 'fruita'
  | 'formatgeria'
  | 'fleca'
  | 'celler'
  | 'drogueria'
  | 'esclatoil'
  | 'altres';

export interface Coupon {
  id: string;
  title: string;
  discountType: DiscountType;
  discountAmount: number; // e.g. 5 for 5€, 20 for 20%
  minPurchase?: number; // Minimum purchase required in euros (e.g. 50€)
  section: SectionType;
  expiryDate: string; // YYYY-MM-DD
  validFrom?: string; // YYYY-MM-DD
  barcode?: string; // Numeric or alphanumeric barcode string
  notes?: string; // Specific conditions or notes
  isUsed: boolean;
  usedAt?: string; // ISO timestamp
  usedBy?: string; // 'Aitor' | 'Xènia' | string
  householdId: string;
  createdBy: string;
  createdAt: string; // ISO timestamp
}

export interface Household {
  id: string;
  name: string;
  code: string;
  createdAt: string;
}

export interface SectionMeta {
  id: SectionType;
  name: string;
  nameEs: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
}

export const SECTIONS: Record<SectionType, SectionMeta> = {
  general: {
    id: 'general',
    name: 'Tota la compra',
    nameEs: 'Compra General',
    iconName: 'ShoppingBag',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    badgeText: 'text-red-700',
    accentColor: '#E30613'
  },
  carnisseria: {
    id: 'carnisseria',
    name: 'Carnisseria i Xarcuteria',
    nameEs: 'Carnicería y Charcutería',
    iconName: 'Beef',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeText: 'text-rose-700',
    accentColor: '#E11D48'
  },
  peixateria: {
    id: 'peixateria',
    name: 'Peixateria',
    nameEs: 'Pescadería',
    iconName: 'Fish',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    badgeText: 'text-sky-700',
    accentColor: '#0284C7'
  },
  fruita: {
    id: 'fruita',
    name: 'Fruita i Verdura',
    nameEs: 'Fruta y Verdura',
    iconName: 'Apple',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    badgeText: 'text-emerald-700',
    accentColor: '#059669'
  },
  formatgeria: {
    id: 'formatgeria',
    name: 'Formatgeria',
    nameEs: 'Quesería',
    iconName: 'Citrus',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeText: 'text-amber-700',
    accentColor: '#D97706'
  },
  fleca: {
    id: 'fleca',
    name: 'Fleca i Pa',
    nameEs: 'Panadería y Bollería',
    iconName: 'Wheat',
    badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    badgeText: 'text-yellow-800',
    accentColor: '#CA8A04'
  },
  celler: {
    id: 'celler',
    name: 'Celler i Vins',
    nameEs: 'Bodega y Vinos',
    iconName: 'Wine',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeText: 'text-purple-700',
    accentColor: '#7E22CE'
  },
  drogueria: {
    id: 'drogueria',
    name: 'Neteja i Llar',
    nameEs: 'Limpieza y Hogar',
    iconName: 'Sparkles',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    badgeText: 'text-teal-700',
    accentColor: '#0D9488'
  },
  esclatoil: {
    id: 'esclatoil',
    name: 'EsclatOil Benzinera',
    nameEs: 'EsclatOil Gasolinera',
    iconName: 'Fuel',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    badgeText: 'text-orange-700',
    accentColor: '#EA580C'
  },
  altres: {
    id: 'altres',
    name: 'Altres Seccions',
    nameEs: 'Otras Secciones',
    iconName: 'Tag',
    badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
    badgeText: 'text-slate-700',
    accentColor: '#64748B'
  }
};
