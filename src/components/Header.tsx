import React from 'react';
import { Users, WifiOff, Sparkles, Tag, AlertTriangle, Bell, User, Lock } from 'lucide-react';
import type { Household } from '../types';

interface HeaderProps {
  household: Household;
  userName: string;
  activeCount: number;
  urgentCount: number;
  alertsCount: number;
  totalSavingsEuro: number;
  isOnline: boolean;
  onLock: () => void;
  onToggleUser: () => void;
  onOpenNotifications: () => void;
  onOpenHousehold: () => void;
  onOpenScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  household,
  userName,
  activeCount,
  urgentCount,
  alertsCount,
  totalSavingsEuro,
  isOnline,
  onLock,
  onToggleUser,
  onOpenNotifications,
  onOpenHousehold,
  onOpenScan,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs pt-safe">
      <div className="max-w-3xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-2.5">
          {/* Brand Logo & Private App Title for Aitor & Xènia */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1 bg-[#E30613] text-white px-2 py-1 rounded-lg font-bold text-[11px] tracking-wider shadow-xs shrink-0">
              <span>BONPREU</span>
              <span className="text-amber-300 font-extrabold text-[9px]">·</span>
              <span className="text-amber-300">ESCLAT</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 leading-tight truncate font-display">
                Descomptes d'Aitor i Xènia
              </h1>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                <span>{household.name}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
                  {household.code}
                </span>
              </p>
            </div>
          </div>

          {/* Right Action Group: Active Profile Switcher + Notification Bell + Family */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isOnline && (
              <div 
                title="Sense connexió: funcionant amb memòria fora de línia"
                className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full font-medium"
              >
                <WifiOff className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}

            {/* Quick Profile Switcher (Aitor <-> Xènia) */}
            <button
              onClick={onToggleUser}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-bold transition-all active:scale-95 border ${
                userName.toLowerCase().includes('xènia') || userName.toLowerCase().includes('xenia')
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
              title={`Ets l'usuari/ària actiu: ${userName}. Fes clic per canviar entre Aitor i Xènia.`}
              aria-label="Canviar perfil entre Aitor i Xènia"
            >
              <User className="w-3 h-3" />
              <span>{userName}</span>
            </button>

            {/* Notification Bell with Badge */}
            <button
              onClick={onOpenNotifications}
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Obrir notificacions de caducitat"
              title="Notificacions i avisos de caducitat"
            >
              <Bell className="w-4 h-4" />
              {alertsCount > 0 && (
                <span className="absolute 1 top-1 right-1 w-4 h-4 bg-[#E30613] text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>

            {/* Family modal button */}
            <button
              onClick={onOpenHousehold}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Configuració del grup familiar"
              title="Codi i sincronització familiar"
            >
              <Users className="w-4 h-4 text-red-600" />
            </button>

            {/* Lock App Button */}
            <button
              onClick={onLock}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Bloquejar aplicació amb PIN"
              title="Bloquejar app amb PIN 1430"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Summary Bar */}
        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] text-slate-500 font-medium">Estalvi disponible:</span>
              <span className="font-bold text-sm text-[#E30613] font-display tabular-nums">
                {totalSavingsEuro.toFixed(2)} €
              </span>
            </div>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <div className="text-[11px] text-slate-600">
              <span className="font-semibold text-slate-900 tabular-nums">{activeCount}</span>{' '}
              {activeCount === 1 ? 'val actiu' : 'vales actius'}
            </div>
          </div>

          {urgentCount > 0 && (
            <button
              onClick={onOpenNotifications}
              className="flex items-center gap-1 text-[11px] text-red-700 font-semibold bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{urgentCount} per caducar (≤2 dies)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
