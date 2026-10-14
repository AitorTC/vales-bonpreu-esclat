import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  BellRing, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Barcode, 
  Smartphone,
  Check
} from 'lucide-react';
import type { Coupon } from '../types';
import { 
  type ExpiryAlert, 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendPushNotification 
} from '../lib/notifications';

interface NotificationModalProps {
  alerts: ExpiryAlert[];
  coupons: Coupon[];
  onClose: () => void;
  onOpenCouponBarcode: (coupon: Coupon) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  alerts,
  coupons,
  onClose,
  onOpenCouponBarcode,
}) => {
  const [permission, setPermission] = useState(getNotificationPermission());
  const [testSent, setTestSent] = useState(false);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      sendPushNotification(
        "Notificacions d'Aitor i Xènia activades!",
        "T'avisarem amb 2 dies d'antelació quan un val estigui a punt de caducar."
      );
    }
  };

  const handleTestNotification = () => {
    sendPushNotification(
      "Proba de notificació Bonpreu Esclat",
      "El sistema d'avisos per a Aitor i Xènia funciona perfectament al teu mòbil!"
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Find coupon matching alert
  const getCoupon = (couponId: string) => coupons.find((c) => c.id === couponId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#E30613] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Centre de Notificacions
              </h2>
              <p className="text-[11px] text-slate-500">
                Avisos de caducitat amb 2 dies d'antelació i avisos mòbil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tancar notificacions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Mobile Push Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">Notificacions Push al Mòbil</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                permission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}>
                {permission === 'granted' ? 'Activades ✓' : 'Pendent'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Rebràs alertes a la pantalla del telèfon amb <strong>2 dies d'antelació</strong> abans que caduqui qualsevol val, i quan la teva parella n'afegeixi un de nou.
            </p>

            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="w-full py-2.5 px-4 bg-[#E30613] hover:bg-red-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4" />
                <span>Activar Notificacions al Telèfon</span>
              </button>
            ) : (
              <button
                onClick={handleTestNotification}
                className="w-full py-2 px-3 bg-slate-700/80 hover:bg-slate-700 active:scale-95 text-xs text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {testSent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Notificació de prova enviada!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Enviar notificació de prova al mòbil</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tip for App Closed Notifications */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-red-600" />
              <span>Com rebre avisos amb l'aplicació tancada:</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Afegeix la web a la pantalla d'inici del teu telèfon per rebre les alertes push en segon pla:
            </p>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-slate-600 pl-1">
              <li><strong>iPhone (Safari):</strong> Prem Compartir (fletxa amunt) ➔ <em>"Afegir a pantalla d'inici"</em>.</li>
              <li><strong>Android (Chrome):</strong> Prem els 3 punts ➔ <em>"Instal·lar aplicació"</em> o <em>"Afegir a pantalla principal"</em>.</li>
            </ul>
          </div>

          {/* Section: Urgent Expiry Alerts (<= 2 days) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Vales per caducar en 2 dies o menys ({alerts.length}):</span>
            </h3>

            {alerts.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <p className="text-xs font-bold text-emerald-800">
                  Cap val en perill de caducitat!
                </p>
                <p className="text-[11px] text-emerald-700">
                  Tots els teus vales tenen més de 2 dies de marge.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const coupon = getCoupon(alert.couponId);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        alert.daysLeft === 0
                          ? 'bg-red-50 border-red-300 ring-1 ring-red-200'
                          : alert.daysLeft === 1
                          ? 'bg-orange-50 border-orange-300'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                            alert.daysLeft === 0 ? 'text-red-700' : 'text-amber-800'
                          }`}>
                            {alert.daysLeft === 0
                              ? '🚨 CADUCA AVUI!'
                              : alert.daysLeft === 1
                              ? '⚠️ CADUCA DEMÀ'
                              : '⏳ CADUCA D\'AQUÍ A 2 DIES'}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900 mt-0.5">
                            {coupon?.title || alert.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {alert.body}
                          </p>
                        </div>

                        {coupon && (
                          <button
                            onClick={() => {
                              onOpenCouponBarcode(coupon);
                              onClose();
                            }}
                            className="shrink-0 p-2 bg-slate-900 hover:bg-[#E30613] text-white rounded-xl active:scale-95 transition-colors"
                            title="Obrir codi de barres per caixa"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
};
