import React, { useMemo, useState } from 'react';
import { X, CheckCircle2, Copy, Check, Sun, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Coupon } from '../types';
import { SECTIONS } from '../types';
import { generateCode128Bars } from '../lib/barcodeGenerator';
import { getExpiryInfo, formatDateSpanish } from '../lib/dateUtils';

interface BarcodeModalProps {
  coupon: Coupon;
  onClose: () => void;
  onToggleUsed: (couponId: string, isUsed: boolean) => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalInQueue?: number;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({
  coupon,
  onClose,
  onToggleUsed,
  onNext,
  onPrev,
  currentIndex,
  totalInQueue,
}) => {
  const [copied, setCopied] = useState(false);
  const [highBrightness, setHighBrightness] = useState(true);

  const barcodeText = coupon.barcode || coupon.id.replace(/[^0-9A-Z]/gi, '').slice(0, 12) || '841029482910';
  const { bars, totalWidth } = useMemo(() => generateCode128Bars(barcodeText), [barcodeText]);
  const sectionMeta = SECTIONS[coupon.section] || SECTIONS.general;
  const expiry = getExpiryInfo(coupon.expiryDate);

  const handleCopy = () => {
    navigator.clipboard?.writeText(barcodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = () => {
    // Confetti effect for celebrating savings at the cash register!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E30613', '#F58220', '#10B981', '#FFD700']
      });
    } catch {
      // ignore
    }

    onToggleUsed(coupon.id, !coupon.isUsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300 ${
          highBrightness ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-[#E30613]">
              BONPREU ESCLAT
            </span>
            {totalInQueue && totalInQueue > 1 && (
              <span className="text-xs text-slate-500 font-mono">
                {currentIndex! + 1} de {totalInQueue}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Tancar finestra de codi de barres"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Coupon Value & Title */}
        <div className="px-5 pt-4 pb-2 text-center">
          <div className="inline-block text-xs font-semibold text-slate-600 mb-1">
            {sectionMeta.name}
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-display leading-snug">
            {coupon.title}
          </h2>
          {coupon.minPurchase && coupon.minPurchase > 0 && (
            <p className="text-xs text-slate-600 mt-1 font-medium bg-slate-50 py-1 px-2 rounded-lg inline-block">
              Per compres superiors a <span className="font-bold text-slate-900">{coupon.minPurchase} €</span>
            </p>
          )}
        </div>

        {/* SCANNER READY BARCODE ZONE (ALWAYS PURE WHITE BACKGROUND FOR OPTICAL READERS) */}
        <div className="mx-4 my-2 p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex flex-col items-center">
          <div className="w-full flex justify-center py-2 overflow-hidden">
            {bars.length > 0 ? (
              <svg
                viewBox={`0 0 ${totalWidth} 80`}
                className="w-full max-w-[280px] h-20"
                preserveAspectRatio="none"
              >
                {bars.reduce(
                  (acc, bar, i) => {
                    const currentX = acc.currentX;
                    const nextX = currentX + bar.width;
                    if (bar.isBlack) {
                      acc.elements.push(
                        <rect
                          key={i}
                          x={currentX}
                          y={0}
                          width={bar.width}
                          height={80}
                          fill="#000000"
                        />
                      );
                    }
                    acc.currentX = nextX;
                    return acc;
                  },
                  { currentX: 0, elements: [] as React.ReactNode[] }
                ).elements}
              </svg>
            ) : (
              <div className="h-20 flex items-center justify-center text-xs text-slate-400">
                Sense codi de barres
              </div>
            )}
          </div>

          {/* Barcode Number Display (Spaced for Cashier manual typing if needed) */}
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm tracking-widest font-bold text-slate-900 select-all">
              {barcodeText}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Copiar número de val"
              aria-label="Copiar número del vale"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
            <Sun className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Posa el telèfon davant del lector de caixa</span>
          </p>
        </div>

        {/* Expiry Details */}
        <div className="px-5 py-2 flex items-center justify-between text-xs text-slate-600">
          <span>Caducitat: {formatDateSpanish(coupon.expiryDate)}</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${expiry.badgeClass}`}>
            {expiry.label}
          </span>
        </div>

        {coupon.notes && (
          <div className="px-5 py-1 text-[11px] text-slate-600 italic">
            Nota: {coupon.notes}
          </div>
        )}

        {/* Next / Prev Carousel Controls if in queue */}
        {totalInQueue && totalInQueue > 1 && (
          <div className="px-4 py-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-xs text-slate-600 font-medium disabled:opacity-30 px-3 py-2 rounded-lg hover:bg-slate-100 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior val</span>
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === totalInQueue - 1}
              className="flex items-center gap-1 text-xs text-slate-600 font-medium disabled:opacity-30 px-3 py-2 rounded-lg hover:bg-slate-100 active:scale-95"
            >
              <span>Següent val</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom Actions: Redeem / Used Toggle */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button
            onClick={handleRedeem}
            className={`flex-1 min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm ${
              coupon.isUsed
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-[#E30613] text-white hover:bg-red-700'
            }`}
          >
            {coupon.isUsed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Desmarcar com a usat</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ja l'he passat per caixa (Marcar usat)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
