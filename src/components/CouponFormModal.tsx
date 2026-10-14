import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Calendar, Sparkles, Tag, Plus, Barcode, Info, Camera, RefreshCw } from 'lucide-react';
import type { Coupon, DiscountType, SectionType } from '../types';
import { SECTIONS } from '../types';
import { scanCouponWithAI } from '../lib/geminiScan';

interface CouponFormModalProps {
  initialCoupon?: Coupon | null;
  prefilledData?: Partial<Coupon> | null;
  photoPreview?: string | null;
  householdId: string;
  userName: string;
  onSave: (coupon: Coupon) => void;
  onClose: () => void;
}

export const CouponFormModal: React.FC<CouponFormModalProps> = ({
  initialCoupon,
  prefilledData,
  photoPreview: initialPhoto,
  householdId,
  userName,
  onSave,
  onClose,
}) => {
  const [photo, setPhoto] = useState<string | null>(initialPhoto || null);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(Boolean(prefilledData || initialPhoto));

  const [title, setTitle] = useState(initialCoupon?.title || prefilledData?.title || '');
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialCoupon?.discountType || prefilledData?.discountType || 'fixed'
  );
  const [discountAmount, setDiscountAmount] = useState<string>(
    initialCoupon 
      ? String(initialCoupon.discountAmount) 
      : prefilledData?.discountAmount !== undefined 
      ? String(prefilledData.discountAmount) 
      : '5.00'
  );
  const [minPurchase, setMinPurchase] = useState<string>(
    initialCoupon?.minPurchase 
      ? String(initialCoupon.minPurchase) 
      : prefilledData?.minPurchase 
      ? String(prefilledData.minPurchase) 
      : '50.00'
  );
  const [section, setSection] = useState<SectionType>(
    initialCoupon?.section || prefilledData?.section || 'general'
  );
  
  const defaultExpDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  const [expiryDate, setExpiryDate] = useState<string>(
    initialCoupon?.expiryDate || prefilledData?.expiryDate || defaultExpDate()
  );
  const [barcode, setBarcode] = useState<string>(
    initialCoupon?.barcode || prefilledData?.barcode || ''
  );
  const [notes, setNotes] = useState<string>(
    initialCoupon?.notes || prefilledData?.notes || ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Taken from Camera
  const handlePhotoCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningPhoto(true);

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setPhoto(base64);

      try {
        const extracted = await scanCouponWithAI(base64, file.type);
        if (extracted.title) setTitle(extracted.title);
        if (extracted.discountType) setDiscountType(extracted.discountType as DiscountType);
        if (extracted.discountAmount !== undefined) setDiscountAmount(String(extracted.discountAmount));
        if (extracted.minPurchase !== undefined) setMinPurchase(String(extracted.minPurchase));
        if (extracted.section) setSection(extracted.section as SectionType);
        if (extracted.expiryDate) setExpiryDate(extracted.expiryDate);
        if (extracted.barcode) setBarcode(extracted.barcode);
        if (extracted.notes) setNotes(extracted.notes);
        setIsAutoFilled(true);
      } catch (err) {
        console.warn('Error escanejant foto:', err);
      } finally {
        setIsScanningPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Bonpreu Templates
  const applyPreset = (preset: {
    title: string;
    discountType: DiscountType;
    discountAmount: number;
    minPurchase: number;
    section: SectionType;
    days: number;
  }) => {
    setTitle(preset.title);
    setDiscountType(preset.discountType);
    setDiscountAmount(String(preset.discountAmount));
    setMinPurchase(preset.minPurchase ? String(preset.minPurchase) : '');
    setSection(preset.section);

    const d = new Date();
    d.setDate(d.getDate() + preset.days);
    setExpiryDate(d.toISOString().split('T')[0]);

    if (!barcode) {
      const randomNum = Math.floor(10000000 + Math.random() * 90000000);
      setBarcode(`84${randomNum}`);
    }
  };

  const setExpiryDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiryDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Introdueix un títol o descripció per al val';
    }

    const numAmount = parseFloat(discountAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      newErrors.discountAmount = 'Indica un import vàlid';
    }

    if (!expiryDate) {
      newErrors.expiryDate = 'Indica la data de caducitat del val';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalBarcode = barcode.trim() || `84${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const savedCoupon: Coupon = {
      id: initialCoupon?.id || `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      discountType,
      discountAmount: numAmount,
      minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
      section,
      expiryDate,
      barcode: finalBarcode,
      notes: notes.trim() || undefined,
      isUsed: initialCoupon?.isUsed ?? false,
      usedAt: initialCoupon?.usedAt,
      usedBy: initialCoupon?.usedBy,
      householdId,
      createdBy: initialCoupon?.createdBy || userName,
      createdAt: initialCoupon?.createdAt || new Date().toISOString(),
    };

    onSave(savedCoupon);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Hidden Camera Input */}
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoCaptured}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              {initialCoupon ? 'Editar Val de Descompte' : 'Afegir Val per a Aitor i Xènia'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Registrant com a: <strong className="text-red-700">{userName}</strong> (sincronitzat en temps real)
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tancar formulari"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* CAMERA AUTO-FILL HERO BUTTON */}
          <div className="p-3.5 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#E30613] text-white flex items-center justify-center shrink-0 shadow-xs">
                {isScanningPhoto ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {isScanningPhoto ? 'Analitzant foto amb IA...' : 'Fer foto al val de Bonpreu'}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  La IA omplirà l'import, la data i el codi a l'instant
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={isScanningPhoto}
              onClick={() => cameraInputRef.current?.click()}
              className="px-3.5 py-2 bg-[#E30613] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Fer foto</span>
            </button>
          </div>

          {/* Photo Preview and Auto-fill Confirmation Badge */}
          {photo && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
              <img
                src={photo}
                alt="Foto del val"
                className="w-14 h-14 object-cover rounded-xl border border-emerald-300 shrink-0"
              />
              <div className="flex-1 min-w-0 text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Dades omplertes automàticament de la foto!
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Revisa els camps i prem el botó vermell per guardar-lo.
                </p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Descripció o títol del val *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 5€ de descompte en compra de 50€"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all ${
                errors.title ? 'border-red-400 bg-red-50/50' : 'border-slate-300 focus:border-red-500'
              }`}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Secció del Bonpreu Esclat
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as SectionType)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
            >
              {Object.values(SECTIONS).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.nameEs})
                </option>
              ))}
            </select>
          </div>

          {/* Discount Type & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Tipus de descompte
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white"
              >
                <option value="fixed">Import fix (€)</option>
                <option value="percentage">Percentatge (%)</option>
                <option value="promo">Promoció / Oferta</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                {discountType === 'percentage' ? 'Percentatge (%)' : 'Quantitat (€)'} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="5.00"
                className={`w-full px-3 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-mono ${
                  errors.discountAmount ? 'border-red-400 bg-red-50/50' : 'border-slate-300 focus:border-red-500'
                }`}
              />
              {errors.discountAmount && <p className="text-xs text-red-600 mt-1">{errors.discountAmount}</p>}
            </div>
          </div>

          {/* Minimum Purchase */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Compra mínima requerida (€) <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minPurchase}
              onChange={(e) => setMinPurchase(e.target.value)}
              placeholder="Ex: 50.00 (deixar buit si no n'hi ha)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-800">
                Data límit de caducitat *
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => setExpiryDays(2)}
                  className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-bold hover:bg-red-100"
                >
                  +2d
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryDays(7)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200"
                >
                  +7d
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryDays(14)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200"
                >
                  +14d
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-mono ${
                  errors.expiryDate ? 'border-red-400 bg-red-50/50' : 'border-slate-300 focus:border-red-500'
                }`}
              />
            </div>
            {errors.expiryDate && <p className="text-xs text-red-600 mt-1">{errors.expiryDate}</p>}
          </div>

          {/* Barcode Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-slate-500" />
                <span>Codi de barres per passar per caixa</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                (s'omple automàtic si es deixa buit)
              </span>
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Ex: 8410294829103"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Condicions o lletra petita <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Vàlid a tots els supermercats Esclat amb targeta client."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl text-slate-600 hover:bg-slate-200/60 font-medium text-sm transition-colors"
          >
            Cancel·lar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="min-h-[44px] px-5 rounded-xl bg-[#E30613] hover:bg-red-700 active:scale-95 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{initialCoupon ? 'Guardar Canvis' : 'Guardar Val al Monedero'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
