import React, { useState, useMemo } from 'react';
import { Calculator, ShoppingCart, Check, Barcode, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import type { Coupon } from '../types';
import { SECTIONS } from '../types';

interface CheckoutCalculatorProps {
  coupons: Coupon[];
  onOpenBarcodeQueue: (selectedCoupons: Coupon[]) => void;
}

export const CheckoutCalculator: React.FC<CheckoutCalculatorProps> = ({
  coupons,
  onOpenBarcodeQueue,
}) => {
  const [cartAmountStr, setCartAmountStr] = useState<string>('60.00');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Only consider active, non-expired, non-used coupons
  const activeCoupons = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return coupons.filter((c) => !c.isUsed && c.expiryDate >= today);
  }, [coupons]);

  const cartAmount = parseFloat(cartAmountStr) || 0;

  // Toggle selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Select all applicable
  const selectAllApplicable = () => {
    const applicableIds = activeCoupons
      .filter((c) => !c.minPurchase || cartAmount >= c.minPurchase)
      .map((c) => c.id);
    setSelectedIds(new Set(applicableIds));
  };

  // Compute total savings
  const { totalSavings, finalAmount, selectedCouponsList } = useMemo(() => {
    let savings = 0;
    const selectedList: Coupon[] = [];

    activeCoupons.forEach((c) => {
      if (selectedIds.has(c.id)) {
        selectedList.push(c);
        if (c.discountType === 'fixed') {
          savings += c.discountAmount;
        } else if (c.discountType === 'percentage') {
          savings += (cartAmount * c.discountAmount) / 100;
        } else if (c.discountType === 'promo') {
          savings += c.discountAmount;
        }
      }
    });

    const finalPrice = Math.max(0, cartAmount - savings);
    return {
      totalSavings: savings,
      finalAmount: finalPrice,
      selectedCouponsList: selectedList,
    };
  }, [activeCoupons, selectedIds, cartAmount]);

  return (
    <div className="space-y-4">
      {/* Top Card: Cart Amount Input */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-slate-800">
          <Calculator className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold font-display">Calculadora d'Estalvi a Caixa</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Introdueix l'import aproximat de la teva cistella per veure quins vales pots aprofitar avui:
        </p>

        {/* Amount Input */}
        <div className="relative">
          <input
            type="number"
            step="0.50"
            min="0"
            value={cartAmountStr}
            onChange={(e) => setCartAmountStr(e.target.value)}
            className="w-full text-2xl font-bold font-display px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
            placeholder="0.00"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
            €
          </span>
        </div>

        {/* Quick Amount presets */}
        <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {[30, 50, 70, 100, 120].map((amt) => (
            <button
              key={amt}
              onClick={() => setCartAmountStr(String(amt))}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                cartAmount === amt
                  ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {amt} €
            </button>
          ))}
        </div>
      </div>

      {/* Bill Breakdown Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-md">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Subtotal cistella:</span>
          <span className="font-mono text-sm text-slate-200">{cartAmount.toFixed(2)} €</span>
        </div>

        <div className="flex items-center justify-between text-xs text-emerald-400 font-medium mb-3 pb-3 border-b border-slate-700">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Descompte vales aplicats ({selectedIds.size}):</span>
          </span>
          <span className="font-mono text-base font-bold text-emerald-400">
            -{totalSavings.toFixed(2)} €
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-slate-300">Total net a pagar a caixa:</span>
          <span className="text-3xl font-black font-display text-white tabular-nums">
            {finalAmount.toFixed(2)} €
          </span>
        </div>

        {/* Cash Register Queue Button */}
        {selectedCouponsList.length > 0 && (
          <button
            onClick={() => onOpenBarcodeQueue(selectedCouponsList)}
            className="w-full mt-4 min-h-[48px] bg-[#E30613] hover:bg-red-700 active:scale-98 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Barcode className="w-4 h-4" />
            <span>Passar vales per caixa ({selectedCouponsList.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Coupon Selection List for Checkout */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Selecciona els vales que aplicaràs:
          </h3>
          <button
            onClick={selectAllApplicable}
            className="text-xs text-red-600 font-semibold hover:underline"
          >
            Seleccionar aplicables
          </button>
        </div>

        {activeCoupons.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            No tens vales actius en aquest moment.
          </div>
        ) : (
          <div className="space-y-2">
            {activeCoupons.map((c) => {
              const isSelected = selectedIds.has(c.id);
              const satisfiesMin = !c.minPurchase || cartAmount >= c.minPurchase;
              const sectionMeta = SECTIONS[c.section] || SECTIONS.general;

              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelect(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-red-50/60 border-red-300 shadow-xs'
                      : satisfiesMin
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#E30613] border-[#E30613] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{sectionMeta.name}</span>
                        {c.minPurchase && c.minPurchase > 0 && (
                          <>
                            <span>·</span>
                            <span className={satisfiesMin ? 'text-slate-700 font-medium' : 'text-amber-700'}>
                              Mínim {c.minPurchase} € {satisfiesMin ? '✓' : `(et falten ${(c.minPurchase - cartAmount).toFixed(1)}€)`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="font-bold text-sm text-[#E30613] font-display">
                      {c.discountType === 'percentage'
                        ? `-${c.discountAmount}%`
                        : `${c.discountAmount.toFixed(2)} €`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
