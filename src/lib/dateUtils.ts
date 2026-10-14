export type ExpiryStatus = 'today' | 'tomorrow' | 'soon' | 'normal' | 'expired';

export interface ExpiryInfo {
  status: ExpiryStatus;
  daysLeft: number;
  label: string;
  badgeClass: string;
  isUrgent: boolean;
}

export function getExpiryInfo(expiryDateStr: string): ExpiryInfo {
  if (!expiryDateStr) {
    return {
      status: 'normal',
      daysLeft: 999,
      label: 'Sense data',
      badgeClass: 'text-slate-600 bg-slate-100 border-slate-200',
      isUrgent: false,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parts = expiryDateStr.split('-');
  const expYear = parseInt(parts[0], 10);
  const expMonth = parseInt(parts[1], 10) - 1;
  const expDay = parseInt(parts[2], 10);
  const expDate = new Date(expYear, expMonth, expDay);

  const diffTime = expDate.getTime() - today.getTime();
  const daysLeft = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: 'expired',
      daysLeft,
      label: daysLeft === -1 ? 'Caducat ahir' : `Caducat fa ${Math.abs(daysLeft)} dies`,
      badgeClass: 'text-slate-500 bg-slate-100 border-slate-200 line-through',
      isUrgent: false,
    };
  }

  if (daysLeft === 0) {
    return {
      status: 'today',
      daysLeft: 0,
      label: 'Caduca AVUI!',
      badgeClass: 'text-red-700 bg-red-100 border-red-300 font-bold animate-pulse',
      isUrgent: true,
    };
  }

  if (daysLeft === 1) {
    return {
      status: 'tomorrow',
      daysLeft: 1,
      label: 'Caduca demà',
      badgeClass: 'text-orange-700 bg-orange-100 border-orange-300 font-semibold',
      isUrgent: true,
    };
  }

  if (daysLeft <= 4) {
    return {
      status: 'soon',
      daysLeft,
      label: `Queden ${daysLeft} dies`,
      badgeClass: 'text-amber-800 bg-amber-100 border-amber-300 font-medium',
      isUrgent: true,
    };
  }

  return {
    status: 'normal',
    daysLeft,
    label: `Vàlid ${daysLeft} dies`,
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    isUrgent: false,
  };
}

export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const months = ['gen', 'feb', 'març', 'abr', 'maig', 'juny', 'jul', 'agost', 'set', 'oct', 'nov', 'des'];
    const mIdx = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} ${months[mIdx] || ''} ${year}`;
  } catch {
    return dateStr;
  }
}
