import React, { useState } from 'react';
import { X, Users, Copy, Check, Share2, LogIn, Plus, Cloud, RefreshCw } from 'lucide-react';
import type { Household } from '../types';

interface HouseholdModalProps {
  currentHousehold: Household;
  userName: string;
  onUpdateUserName: (name: string) => void;
  onSwitchHousehold: (code: string, name?: string) => void;
  onClose: () => void;
}

export const HouseholdModal: React.FC<HouseholdModalProps> = ({
  currentHousehold,
  userName,
  onUpdateUserName,
  onSwitchHousehold,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newName, setNewName] = useState(currentHousehold.name);
  const [editUserName, setEditUserName] = useState(userName);
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(currentHousehold.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `Hola! Afegeix-te al nostre monedero familiar de vales de Bonpreu Esclat. Utilitza aquest codi d'accés: ${currentHousehold.code}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (!clean) return;
    onSwitchHousehold(clean);
  };

  const handleCreateNew = () => {
    const randomCode = `BON-${Math.floor(1000 + Math.random() * 9000)}`;
    onSwitchHousehold(randomCode, 'Nou Monedero Familiar');
  };

  const handleSaveNames = () => {
    if (editUserName.trim()) {
      onUpdateUserName(editUserName.trim());
    }
    if (newName.trim() && newName !== currentHousehold.name) {
      onSwitchHousehold(currentHousehold.code, newName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#E30613] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Monedero Familiar Compartit
              </h2>
              <p className="text-[11px] text-slate-500">
                Sincronitzat al núvol perquè tota la família vegi els mateixos vales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tancar configuració familiar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Share Code Card */}
          <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-2xl text-center">
            <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider block mb-1">
              Codi del teu grup familiar
            </span>
            <div className="flex items-center justify-center gap-2 my-1">
              <span className="font-mono text-2xl font-black text-slate-900 tracking-wider">
                {currentHousehold.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white border border-red-200 hover:bg-red-100 text-slate-700 transition-colors"
                title="Copiar codi"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Qualsevol persona de la família que posi aquest codi tindrà accés en temps real als mateixos vales.
            </p>

            <button
              onClick={handleShareWhatsApp}
              className="mt-3 w-full py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar codi per WhatsApp</span>
            </button>
          </div>

          {/* User & Household Name Settings */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                El teu nom o sobrenom a la família
              </label>
              <input
                type="text"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                placeholder="Ex: Aitor, Marta, Papà..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nom del grup familiar
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Família Torres, Casa..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <button
              onClick={handleSaveNames}
              className="text-xs font-semibold text-red-600 hover:text-red-700 py-1"
            >
              Guardar canvis de nom
            </button>
          </div>

          <hr className="border-slate-100" />

          {/* Join Another Family Space */}
          <div>
            {!showJoinInput ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinInput(true)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Unir-me a un altre grup</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  title="Crear un nou codi independent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nou grup</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinSubmit} className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Introdueix el codi familiar (ex: BON-4819):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="BON-XXXX"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#E30613] hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Connectar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Cloud Info */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500">
            <Cloud className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Les dades es guarden automàticament a Firebase Firestore i es mantenen disponibles fora de línia al mòbil.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
          >
            Fet
          </button>
        </div>
      </div>
    </div>
  );
};
