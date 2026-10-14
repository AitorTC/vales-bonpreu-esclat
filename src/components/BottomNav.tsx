import React from 'react';
import { Tag, Camera, Calculator, History, Plus } from 'lucide-react';

export type TabType = 'coupons' | 'scan' | 'checkout' | 'history';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  urgentCount: number;
  activeCount: number;
  onQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  urgentCount,
  activeCount,
  onQuickAdd,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {/* Tab 1: Vales */}
        <button
          onClick={() => onChangeTab('coupons')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors relative ${
            activeTab === 'coupons' ? 'text-[#E30613]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Pestanya Vales Actius"
        >
          <div className="relative">
            <Tag className="w-5 h-5" />
            {urgentCount > 0 ? (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {urgentCount}
              </span>
            ) : activeCount > 0 ? (
              <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-slate-800 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            ) : null}
          </div>
          <span className="text-[11px] font-medium tracking-tight mt-1">Vales</span>
        </button>

        {/* Tab 2: Escanear / Càmera */}
        <button
          onClick={() => onChangeTab('scan')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'scan' ? 'text-[#E30613]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Pestanya Escanejar amb IA"
        >
          <div className="w-9 h-9 rounded-full bg-red-50 text-[#E30613] flex items-center justify-center shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-tight mt-0.5 text-[#E30613]">Escanear</span>
        </button>

        {/* Tab 3: Caixa / Calculadora */}
        <button
          onClick={() => onChangeTab('checkout')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'checkout' ? 'text-[#E30613]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Pestanya Modo Caixa"
        >
          <Calculator className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight mt-1">Caja</span>
        </button>

        {/* Tab 4: Historial / Canjeats */}
        <button
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            activeTab === 'history' ? 'text-[#E30613]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Pestanya Historial i Vales Usats"
        >
          <History className="w-5 h-5" />
          <span className="text-[11px] font-medium tracking-tight mt-1">Historial</span>
        </button>
      </div>
    </nav>
  );
};
