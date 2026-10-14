import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Sparkles, Check, AlertCircle, RefreshCw, Barcode } from 'lucide-react';
import type { Coupon, DiscountType, SectionType } from '../types';
import { SECTIONS } from '../types';
import { scanCouponWithAI } from '../lib/geminiScan';

interface ScanModalProps {
  householdId: string;
  onSaveCoupon: (coupon: Coupon) => void;
  onClose: () => void;
  onFallbackToManual: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  householdId,
  onSaveCoupon,
  onClose,
  onFallbackToManual,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Coupon> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setExtractedData(null);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setImageSrc(base64);
      analyzeImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string, mimeType: string) => {
    setIsScanning(true);
    setErrorMsg(null);

    try {
      // Direct call to Gemini 3.8 Flash
      const couponData = await scanCouponWithAI(base64, mimeType || 'image/jpeg');
      setExtractedData(couponData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'No s\'ha pogut reconèixer el tiquet. Pots emplenar-lo manualment.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmSave = () => {
    if (!extractedData) return;

    const newCoupon: Coupon = {
      id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: extractedData.title || 'Val de descompte Bonpreu',
      discountType: (extractedData.discountType as DiscountType) || 'fixed',
      discountAmount: Number(extractedData.discountAmount) || 5,
      minPurchase: extractedData.minPurchase ? Number(extractedData.minPurchase) : undefined,
      section: (extractedData.section as SectionType) || 'general',
      expiryDate: extractedData.expiryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      barcode: extractedData.barcode || `84${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      notes: extractedData.notes,
      isUsed: false,
      householdId,
      createdBy: 'Familia',
      createdAt: new Date().toISOString(),
    };

    onSaveCoupon(newCoupon);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#E30613] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Escaner de Vales Bonpreu Esclat
              </h2>
              <p className="text-[11px] text-slate-500">
                Fes una foto al tiquet o val i la IA n'extraurà les dades
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tancar escàner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* If No Image Uploaded Yet */}
          {!imageSrc && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-red-300 hover:border-red-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-red-50/40 hover:bg-red-50 transition-all active:scale-98"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-md text-[#E30613] flex items-center justify-center mb-3">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm font-display mb-1">
                  Fer foto o pujar foto del val
                </h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Enfoca el cupó que surt al final del tiquet de Bonpreu o Esclat
                </p>
                <div className="mt-4 px-4 py-2 bg-[#E30613] text-white text-xs font-bold rounded-xl shadow-xs">
                  Obrir Càmera
                </div>
              </div>

              {/* Tips for Best Scanning */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-900">Consells per a un bon escaneig:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                  <li>Estira bé el paper tèrmic per evitar arrugues.</li>
                  <li>Assegura't que el codi de barres i la data de caducitat són visibles.</li>
                  <li>Si estàs a la cua de caixa i tens pressa, pots introduir-lo en 5 segons amb el formulari ràpid.</li>
                </ul>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onFallbackToManual}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold underline underline-offset-2"
                >
                  Prefereixo introduir les dades a mà
                </button>
              </div>
            </div>
          )}

          {/* If Image is Uploaded */}
          {imageSrc && (
            <div className="space-y-4">
              {/* Image Preview with scanning line */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 max-h-56 flex items-center justify-center">
                <img
                  src={imageSrc}
                  alt="Tiquet o val"
                  className="w-full object-contain max-h-56"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-red-600/15 flex flex-col items-center justify-center backdrop-blur-2xs">
                    <div className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-red-600 animate-spin mb-2">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full shadow-sm">
                      Llegint val amb Gemini...
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">No s'ha pogut llegir automàticament:</p>
                    <p className="text-[11px] mt-0.5">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={onFallbackToManual}
                      className="mt-2 text-xs font-bold underline"
                    >
                      Emplenar formulari manual
                    </button>
                  </div>
                </div>
              )}

              {/* Extracted Coupon Data Ready to Confirm */}
              {extractedData && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Val detectat amb èxit! Revisa les dades:</span>
                  </div>

                  {/* Editable Preview Fields */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Títol:</span>
                      <input
                        type="text"
                        value={extractedData.title || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                        className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-medium">Import descompte:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.discountAmount ?? ''}
                          onChange={(e) =>
                            setExtractedData({
                              ...extractedData,
                              discountAmount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 font-medium">Compra mínima (€):</span>
                        <input
                          type="number"
                          step="0.01"
                          value={extractedData.minPurchase ?? ''}
                          onChange={(e) =>
                            setExtractedData({
                              ...extractedData,
                              minPurchase: parseFloat(e.target.value) || undefined,
                            })
                          }
                          className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-medium">Caducitat:</span>
                        <input
                          type="date"
                          value={extractedData.expiryDate || ''}
                          onChange={(e) => setExtractedData({ ...extractedData, expiryDate: e.target.value })}
                          className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-slate-900"
                        />
                      </div>

                      <div>
                        <span className="text-slate-500 font-medium">Secció:</span>
                        <select
                          value={extractedData.section || 'general'}
                          onChange={(e) =>
                            setExtractedData({ ...extractedData, section: e.target.value as SectionType })
                          }
                          className="w-full mt-0.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900"
                        >
                          {Object.values(SECTIONS).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Codi de barres:</span>
                      <input
                        type="text"
                        value={extractedData.barcode || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, barcode: e.target.value })}
                        className="w-full mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono tracking-wider text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Re-take photo button */}
              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Repetir foto</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl text-slate-600 font-medium text-sm hover:bg-slate-200/60"
          >
            Cancel·lar
          </button>

          {extractedData && (
            <button
              type="button"
              onClick={handleConfirmSave}
              className="min-h-[44px] px-5 rounded-xl bg-[#E30613] hover:bg-red-700 active:scale-95 text-white font-bold text-sm shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Val al Monedero</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
