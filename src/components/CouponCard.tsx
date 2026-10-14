import React from 'react';
import { 
  Barcode, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  AlertCircle,
  ShoppingBag,
  Beef,
  Fish,
  Apple,
  Citrus,
  Wheat,
  Wine,
  Sparkles,
  Fuel,
  Tag
} from 'lucide-react';
import type { Coupon } from '../types';
import { SECTIONS } from '../types';
import { getExpiryInfo, formatDateSpanish } from '../lib/dateUtils';

interface CouponCardProps {
  coupon: Coupon;
  onShowBarcode: (coupon: Coupon) => void;
  onToggleUsed: (couponId: string, isUsed: boolean) => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: string) => void;
  isSelectedInCart?: boolean;
  onToggleSelectInCart?: (couponId: string) => void;
}

// Map section to clean Lucide icons
const SECTION_ICONS: Record<string, React.FC<{ className?: string }>> = {
  ShoppingBag,
  Beef,
  Fish,
  Apple,
  Citrus,
  Wheat,
  Wine,
  Sparkles,
  Fuel,
  Tag
};

export const CouponCard: React.FC<CouponCardProps> = ({
  coupon,
  onShowBarcode,
  onToggleUsed,
  onEdit,
  onDelete,
  isSelectedInCart,
  onToggleSelectInCart,
}) => {
  const sectionMeta = SECTIONS[coupon.section] || SECTIONS.general;
  const expiry = getExpiryInfo(coupon.expiryDate);
  const IconComponent = SECTION_ICONS[sectionMeta.iconName] || Tag;

  const isExpired = expiry.status === 'expired';

  // Format discount text
  let discountBadge = '';
  if (coupon.discountType === 'fixed') {
    discountBadge = `${coupon.discountAmount.toFixed(2).replace('.', ',')} €`;
  } else if (coupon.discountType === 'percentage') {
    discountBadge = `-${coupon.discountAmount}%`;
  } else {
    discountBadge = 'OFERTA';
  }

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-200 overflow-hidden ${
        coupon.isUsed
          ? 'bg-slate-50/70 border-slate-200 opacity-60'
          : isExpired
          ? 'bg-slate-50 border-slate-200 opacity-70'
          : expiry.isUrgent
          ? 'bg-white border-red-200 shadow-sm ring-1 ring-red-100'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Top Banner Stripe: Section & Expiry Status without candy pills */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-slate-100/80 text-xs">
        {/* Section title with subtle icon */}
        <div className="flex items-center gap-1.5 font-medium text-slate-700 min-w-0">
          <IconComponent className="w-3.5 h-3.5 shrink-0 text-red-600" />
          <span className="truncate">{sectionMeta.name}</span>
        </div>

        {/* Expiry metadata with human-readable urgency */}
        <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
          {coupon.isUsed ? (
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Canjeat</span>
            </span>
          ) : isExpired ? (
            <span className="text-slate-400 line-through">
              {expiry.label}
            </span>
          ) : (
            <span className={`flex items-center gap-1 font-semibold ${
              expiry.status === 'today'
                ? 'text-red-600'
                : expiry.status === 'tomorrow'
                ? 'text-orange-600'
                : expiry.status === 'soon'
                ? 'text-amber-700'
                : 'text-slate-600'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{expiry.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Main Title and details */}
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-bold leading-snug font-display text-slate-900 ${
              coupon.isUsed || isExpired ? 'line-through text-slate-500' : ''
            }`}>
              {coupon.title}
            </h3>

            {/* Conditions / Minimum Purchase */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              {coupon.minPurchase && coupon.minPurchase > 0 ? (
                <span>
                  Compra mínima: <strong className="text-slate-700 font-medium">{coupon.minPurchase} €</strong>
                </span>
              ) : (
                <span>Sense compra mínima</span>
              )}
              <span aria-hidden="true">·</span>
              <span>Fins al {formatDateSpanish(coupon.expiryDate)}</span>
            </div>

            {coupon.notes && (
              <p className="mt-1 text-[11px] text-slate-500 line-clamp-1 italic">
                {coupon.notes}
              </p>
            )}

            {/* Author & Redemption by Aitor / Xènia */}
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Per: <strong className="text-slate-700 font-semibold">{coupon.createdBy || 'Aitor/Xènia'}</strong></span>
              {coupon.isUsed && coupon.usedBy && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-medium">Canjeat per {coupon.usedBy}</span>
                </>
              )}
            </div>
          </div>

          {/* Big Discount Value Display */}
          <div className="shrink-0 text-right">
            <div className={`text-2xl font-black font-display tracking-tight leading-none tabular-nums ${
              coupon.isUsed
                ? 'text-slate-400'
                : 'text-[#E30613]'
            }`}>
              {discountBadge}
            </div>
            {coupon.discountType === 'promo' && coupon.discountAmount > 0 && (
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {coupon.discountAmount} € valor
              </span>
            )}
          </div>
        </div>

        {/* Barcode Snippet Preview or Quick Identifier */}
        {coupon.barcode && (
          <div className="mt-3 py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
            <span className="flex items-center gap-1.5 truncate">
              <Barcode className="w-3.5 h-3.5 text-slate-400" />
              <span className="tracking-wider">{coupon.barcode}</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans">
              Codi de barres
            </span>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Toggle Used / Redeemed Quick Control */}
        <button
          onClick={() => onToggleUsed(coupon.id, !coupon.isUsed)}
          className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95 ${
            coupon.isUsed
              ? 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
          }`}
          title={coupon.isUsed ? 'Desmarcar com a usat' : 'Marcar com a canjeat a caixa'}
        >
          <CheckCircle2 className={`w-4 h-4 ${coupon.isUsed ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span>{coupon.isUsed ? 'Canjeat' : 'Marcar usat'}</span>
        </button>

        {/* Action Group: Show Barcode (Primary) & Edit / Delete */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(coupon)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
            title="Editar val"
            aria-label="Editar val"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(coupon.id)}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Eliminar val"
            aria-label="Eliminar val"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Primary CTA: Show Barcode at Checkout */}
          <button
            onClick={() => onShowBarcode(coupon)}
            className="min-h-[40px] px-3.5 bg-slate-900 hover:bg-[#E30613] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            aria-label="Obrir codi de barres per a caixa"
          >
            <Barcode className="w-4 h-4" />
            <span>Veure Codi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
