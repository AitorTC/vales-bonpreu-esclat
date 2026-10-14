import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  RotateCcw, 
  ShoppingBag,
  History,
  X,
  TrendingUp,
  Tag,
  Bell,
  User,
  Users
} from 'lucide-react';
import type { Coupon, Household, SectionType } from './types';
import { SECTIONS } from './types';
import { 
  subscribeToCoupons, 
  saveCoupon, 
  deleteCoupon, 
  setCouponUsed, 
  getLocalCoupons,
  setLocalCoupons
} from './lib/firebase';
import { getExpiryInfo, formatDateSpanish } from './lib/dateUtils';
import { checkExpiringCoupons, triggerPushForNewAlerts, requestNotificationPermission } from './lib/notifications';
import { Header } from './components/Header';
import { BottomNav, type TabType } from './components/BottomNav';
import { CouponCard } from './components/CouponCard';
import { BarcodeModal } from './components/BarcodeModal';
import { CouponFormModal } from './components/CouponFormModal';
import { ScanModal } from './components/ScanModal';
import { CheckoutCalculator } from './components/CheckoutCalculator';
import { HouseholdModal } from './components/HouseholdModal';
import { NotificationModal } from './components/NotificationModal';
import { PinLockScreen } from './components/PinLockScreen';

const HOUSEHOLD_STORAGE_KEY = 'bonpreu_active_household_aitor_xenia';
const USERNAME_STORAGE_KEY = 'bonpreu_user_name_aitor_xenia';
const PIN_SESSION_KEY = 'bonpreu_pin_unlocked_session';

export default function App() {
  // PIN 1430 security lock
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return sessionStorage.getItem(PIN_SESSION_KEY) !== 'true';
  });

  const handleUnlock = () => {
    sessionStorage.setItem(PIN_SESSION_KEY, 'true');
    setIsLocked(false);
  };

  const handleLock = () => {
    sessionStorage.removeItem(PIN_SESSION_KEY);
    setIsLocked(true);
  };

  // Shared Household State for Aitor and Xènia
  const [household, setHousehold] = useState<Household>(() => {
    try {
      const saved = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'household-aitor-xenia-bonpreu',
      name: "Descomptes d'Aitor i Xènia",
      code: 'AITOR-XENIA',
      createdAt: new Date().toISOString(),
    };
  });

  // Current active user on this device (Aitor or Xènia)
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem(USERNAME_STORAGE_KEY) || 'Aitor';
  });

  // Coupons data & online status
  const [coupons, setCoupons] = useState<Coupon[]>(() => getLocalCoupons(household.id));
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Navigation & Filter state
  const [activeTab, setActiveTab] = useState<TabType>('coupons');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeBarcodeCoupon, setActiveBarcodeCoupon] = useState<Coupon | null>(null);
  const [barcodeQueue, setBarcodeQueue] = useState<Coupon[] | null>(null);
  const [barcodeQueueIndex, setBarcodeQueueIndex] = useState<number>(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isHouseholdOpen, setIsHouseholdOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Calculate 2-day expiry alerts
  const expiryAlerts = useMemo(() => {
    return checkExpiringCoupons(coupons);
  }, [coupons]);

  // Request notification permission and trigger push alerts for expiring coupons
  useEffect(() => {
    if (expiryAlerts.length > 0) {
      triggerPushForNewAlerts(expiryAlerts);
    }
  }, [expiryAlerts]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist household changes
  useEffect(() => {
    try {
      localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(household));
    } catch {}
  }, [household]);

  // Real-time Firestore sync: updates both Aitor's and Xènia's phones instantly!
  useEffect(() => {
    const unsubscribe = subscribeToCoupons(household.id, (freshCoupons) => {
      setCoupons(freshCoupons);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [household.id]);

  // Toggle active profile between Aitor and Xènia
  const handleToggleUser = () => {
    const nextUser = userName.toLowerCase().includes('aitor') ? 'Xènia' : 'Aitor';
    setUserName(nextUser);
    localStorage.setItem(USERNAME_STORAGE_KEY, nextUser);
  };

  const handleUpdateUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem(USERNAME_STORAGE_KEY, name);
  };

  const handleSwitchHousehold = (code: string, newName?: string) => {
    const cleanCode = code.trim().toUpperCase();
    const updated: Household = {
      id: `household-${cleanCode.toLowerCase()}`,
      name: newName || (cleanCode === 'AITOR-XENIA' ? "Descomptes d'Aitor i Xènia" : `Família ${cleanCode}`),
      code: cleanCode,
      createdAt: new Date().toISOString(),
    };
    setHousehold(updated);
    setIsHouseholdOpen(false);
  };

  // Coupon CRUD Actions
  const handleSaveCoupon = async (couponToSave: Coupon) => {
    const withAuthor: Coupon = {
      ...couponToSave,
      householdId: household.id,
      createdBy: userName, // Records whether Aitor or Xènia created it
    };
    await saveCoupon(withAuthor);
    setIsFormOpen(false);
    setEditingCoupon(null);
    setIsScanOpen(false);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (window.confirm('Vols eliminar definitivament aquest val?')) {
      await deleteCoupon(household.id, couponId);
    }
  };

  const handleToggleUsed = async (couponId: string, isUsed: boolean) => {
    // Records who redeemed the coupon (Aitor or Xènia)
    await setCouponUsed(household.id, couponId, isUsed, userName);
    if (activeBarcodeCoupon && activeBarcodeCoupon.id === couponId) {
      setActiveBarcodeCoupon((prev) => (prev ? { ...prev, isUsed, usedBy: isUsed ? userName : undefined } : null));
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsFormOpen(true);
  };

  // Open Barcode Queue from Checkout Calculator
  const handleOpenBarcodeQueue = (selectedList: Coupon[]) => {
    if (selectedList.length === 0) return;
    setBarcodeQueue(selectedList);
    setBarcodeQueueIndex(0);
    setActiveBarcodeCoupon(selectedList[0]);
  };

  const handleNextBarcodeInQueue = () => {
    if (!barcodeQueue) return;
    const nextIdx = barcodeQueueIndex + 1;
    if (nextIdx < barcodeQueue.length) {
      setBarcodeQueueIndex(nextIdx);
      setActiveBarcodeCoupon(barcodeQueue[nextIdx]);
    }
  };

  const handlePrevBarcodeInQueue = () => {
    if (!barcodeQueue) return;
    const prevIdx = barcodeQueueIndex - 1;
    if (prevIdx >= 0) {
      setBarcodeQueueIndex(prevIdx);
      setActiveBarcodeCoupon(barcodeQueue[prevIdx]);
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    let totalSavingsEuro = 0;
    let activeCount = 0;
    let urgentCount = 0;
    let redeemedSavingsEuro = 0;
    let redeemedCount = 0;

    coupons.forEach((c) => {
      const exp = getExpiryInfo(c.expiryDate);
      if (c.isUsed) {
        redeemedCount++;
        if (c.discountType === 'fixed') redeemedSavingsEuro += c.discountAmount;
      } else if (exp.status !== 'expired') {
        activeCount++;
        // Urgency: <= 2 days
        if (exp.daysLeft >= 0 && exp.daysLeft <= 2) urgentCount++;
        if (c.discountType === 'fixed') {
          totalSavingsEuro += c.discountAmount;
        }
      }
    });

    return {
      totalSavingsEuro,
      activeCount,
      urgentCount,
      redeemedSavingsEuro,
      redeemedCount,
    };
  }, [coupons]);

  // Active coupons sorted by urgency (closest expiry date first)
  const filteredActiveCoupons = useMemo(() => {
    return coupons
      .filter((c) => {
        if (c.isUsed) return false;

        if (selectedSection !== 'all' && c.section !== selectedSection) {
          return false;
        }

        const exp = getExpiryInfo(c.expiryDate);
        if (urgencyFilter === 'urgent' && (exp.daysLeft > 2 || exp.daysLeft < 0)) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = c.title.toLowerCase().includes(q);
          const matchNotes = c.notes?.toLowerCase().includes(q);
          const matchBarcode = c.barcode?.toLowerCase().includes(q);
          const matchAuthor = c.createdBy?.toLowerCase().includes(q);
          const sec = SECTIONS[c.section];
          const matchSec = sec && (sec.name.toLowerCase().includes(q) || sec.nameEs.toLowerCase().includes(q));
          if (!matchTitle && !matchNotes && !matchBarcode && !matchSec && !matchAuthor) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const expA = getExpiryInfo(a.expiryDate);
        const expB = getExpiryInfo(b.expiryDate);

        if (expA.status === 'expired' && expB.status !== 'expired') return 1;
        if (expB.status === 'expired' && expA.status !== 'expired') return -1;

        return a.expiryDate.localeCompare(b.expiryDate);
      });
  }, [coupons, selectedSection, urgencyFilter, searchQuery]);

  // History Coupons (Used or Expired)
  const historyCoupons = useMemo(() => {
    return coupons
      .filter((c) => {
        const exp = getExpiryInfo(c.expiryDate);
        return c.isUsed || exp.status === 'expired';
      })
      .sort((a, b) => (b.usedAt || b.createdAt).localeCompare(a.usedAt || a.createdAt));
  }, [coupons]);

  if (isLocked) {
    return <PinLockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Header with Profile Switcher, Title, and Expiry Notifications */}
      <Header
        household={household}
        userName={userName}
        activeCount={stats.activeCount}
        urgentCount={stats.urgentCount}
        alertsCount={expiryAlerts.length}
        totalSavingsEuro={stats.totalSavingsEuro}
        isOnline={isOnline}
        onLock={handleLock}
        onToggleUser={handleToggleUser}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenHousehold={() => setIsHouseholdOpen(true)}
        onOpenScan={() => setIsScanOpen(true)}
      />

      {/* Real-time 2-Day In-App Expiration Alert Banner */}
      {expiryAlerts.length > 0 && !dismissedBanner && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
          <div 
            onClick={() => setIsNotificationsOpen(true)}
            className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
            <span className="truncate">
              <strong>Atenció {userName}!</strong> Tens {expiryAlerts.length} {expiryAlerts.length === 1 ? 'val que caduca' : 'vales que caduquen'} en 2 dies o menys.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px] font-bold"
            >
              Veure
            </button>
            <button
              onClick={() => setDismissedBanner(true)}
              className="text-white/80 hover:text-white p-1"
              aria-label="Tancar avís"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 pb-28">
        {/* VIEW 1: ACTIVE COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            {/* Search and Quick Add Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca per descompte, secció o persona..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Camera Photo Auto-Fill Button */}
              <button
                onClick={() => setIsScanOpen(true)}
                className="min-h-[44px] px-3.5 bg-[#E30613] hover:bg-red-700 active:scale-95 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                title="Fes una foto al val de Bonpreu per omplir les dades automàticament"
              >
                <Camera className="w-4 h-4" />
                <span>Foto al val</span>
              </button>

              {/* Fast Manual Add Button */}
              <button
                onClick={() => {
                  setEditingCoupon(null);
                  setIsFormOpen(true);
                }}
                className="min-h-[44px] px-3 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all shrink-0"
                title="Afegir manualment"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Manual</span>
              </button>
            </div>

            {/* Filter Tabs: Urgency (<= 2 days) & Section horizontal scroller */}
            <div className="space-y-2">
              {/* Urgency segmented buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUrgencyFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    urgencyFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tots els actius ({stats.activeCount})
                </button>

                <button
                  onClick={() => setUrgencyFilter('urgent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    urgencyFilter === 'urgent'
                      ? 'bg-[#E30613] text-white shadow-xs'
                      : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Caduca en ≤ 2 dies ({stats.urgentCount})</span>
                </button>
              </div>

              {/* Sections horizontal carousel */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedSection('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    selectedSection === 'all'
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Totes les seccions
                </button>
                {Object.values(SECTIONS).map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSection(sec.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                      selectedSection === sec.id
                        ? 'bg-red-100 text-red-800 font-bold border border-red-200'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sec.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupons Feed */}
            {filteredActiveCoupons.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-[#E30613] flex items-center justify-center">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Cap val disponible en aquesta secció
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Escaneja el teu últim tiquet de compra de Bonpreu o Esclat o afegeix un cupó manualment.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => setIsScanOpen(true)}
                    className="min-h-[44px] px-4 py-2 bg-[#E30613] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Escanear amb càmera</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingCoupon(null);
                      setIsFormOpen(true);
                    }}
                    className="min-h-[44px] px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Formulari manual
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActiveCoupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onShowBarcode={(c) => {
                      setBarcodeQueue(null);
                      setActiveBarcodeCoupon(c);
                    }}
                    onToggleUsed={handleToggleUsed}
                    onEdit={handleEditCoupon}
                    onDelete={handleDeleteCoupon}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DIRECT SCAN / CAMERA INTRO */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-[#E30613] flex items-center justify-center mx-auto shadow-inner">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  Escaneig de Vales per a Aitor i Xènia
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Fotografia el tiquet de compra del Bonpreu o Esclat. La IA en detectarà l'import, la secció, la caducitat i el codi de barres perquè tots dos el veieu al mòbil.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <button
                  onClick={() => setIsScanOpen(true)}
                  className="min-h-[48px] px-6 py-2.5 bg-[#E30613] hover:bg-red-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                  <span>Obrir càmera d'escaneig</span>
                </button>
                <button
                  onClick={() => {
                    setEditingCoupon(null);
                    setIsFormOpen(true);
                  }}
                  className="min-h-[48px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition-colors"
                >
                  Introduir val a mà
                </button>
              </div>
            </div>

            {/* Common Bonpreu discount examples for clarity */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <p className="text-xs font-bold text-slate-800">
                Tipus de vales habituals suportats:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-900 block">Descompte directe de compra:</span>
                  <span>5€ per compra superior a 50€, 10€ per compra superior a 70€...</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-900 block">Vales de seccions fresques:</span>
                  <span>-20% en carnisseria, 5€ a peixateria, descomptes a xarcuteria i fruita.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-900 block">EsclatOil:</span>
                  <span>Descomptes en cèntims/litre per a benzina o gasoil a estacions EsclatOil.</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-900 block">Ofertes 2a unitat / 2x1:</span>
                  <span>Promocions de 2a unitat al 70% o 50% aplicables amb codi de val.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CHECKOUT MODE & CALCULATOR */}
        {activeTab === 'checkout' && (
          <CheckoutCalculator
            coupons={coupons}
            onOpenBarcodeQueue={handleOpenBarcodeQueue}
          />
        )}

        {/* VIEW 4: HISTORY & EXPIRED COUPONS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* History Stats Banner */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Estalvi acumulat a caixa:</span>
                <p className="text-2xl font-black font-display text-emerald-600 tabular-nums">
                  {stats.redeemedSavingsEuro.toFixed(2)} €
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {stats.redeemedCount} {stats.redeemedCount === 1 ? 'val canjeat' : 'vales canjeats'}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Historial de Vales Canjeats i Caducats:
              </h3>
            </div>

            {historyCoupons.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                Encara no hi ha vales a l'historial. Quan canjeïs vales a caixa es guardaran aquí!
              </div>
            ) : (
              <div className="space-y-3">
                {historyCoupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    onShowBarcode={(c) => {
                      setBarcodeQueue(null);
                      setActiveBarcodeCoupon(c);
                    }}
                    onToggleUsed={handleToggleUsed}
                    onEdit={handleEditCoupon}
                    onDelete={handleDeleteCoupon}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        urgentCount={stats.urgentCount}
        activeCount={stats.activeCount}
        onQuickAdd={() => {
          setEditingCoupon(null);
          setIsFormOpen(true);
        }}
      />

      {/* FULLSCREEN BARCODE MODAL FOR CASH REGISTER */}
      {activeBarcodeCoupon && (
        <BarcodeModal
          coupon={activeBarcodeCoupon}
          onClose={() => {
            setActiveBarcodeCoupon(null);
            setBarcodeQueue(null);
          }}
          onToggleUsed={handleToggleUsed}
          currentIndex={barcodeQueue ? barcodeQueueIndex : undefined}
          totalInQueue={barcodeQueue ? barcodeQueue.length : undefined}
          onNext={handleNextBarcodeInQueue}
          onPrev={handlePrevBarcodeInQueue}
        />
      )}

      {/* MANUAL COUPON FORM MODAL */}
      {isFormOpen && (
        <CouponFormModal
          initialCoupon={editingCoupon}
          householdId={household.id}
          userName={userName}
          onSave={handleSaveCoupon}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCoupon(null);
          }}
        />
      )}

      {/* SMART RECEIPT SCAN MODAL */}
      {isScanOpen && (
        <ScanModal
          householdId={household.id}
          onSaveCoupon={handleSaveCoupon}
          onClose={() => setIsScanOpen(false)}
          onFallbackToManual={() => {
            setIsScanOpen(false);
            setEditingCoupon(null);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* FAMILY / HOUSEHOLD SYNC MODAL */}
      {isHouseholdOpen && (
        <HouseholdModal
          currentHousehold={household}
          userName={userName}
          onUpdateUserName={handleUpdateUserName}
          onSwitchHousehold={handleSwitchHousehold}
          onClose={() => setIsHouseholdOpen(false)}
        />
      )}

      {/* NOTIFICATIONS & 2-DAY EXPIRY ALERTS MODAL */}
      {isNotificationsOpen && (
        <NotificationModal
          alerts={expiryAlerts}
          coupons={coupons}
          onClose={() => setIsNotificationsOpen(false)}
          onOpenCouponBarcode={(c) => {
            setActiveBarcodeCoupon(c);
            setBarcodeQueue(null);
          }}
        />
      )}
    </div>
  );
}
