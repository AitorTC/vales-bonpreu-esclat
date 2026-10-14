import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle } from 'lucide-react';

interface PinLockScreenProps {
  onUnlock: () => void;
}

const CORRECT_PIN = '1430';

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Handle number click
  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setIsError(false);

      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  // Handle Backspace
  const handleBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const verifyPin = (pin: string) => {
    if (pin === CORRECT_PIN) {
      setTimeout(() => {
        onUnlock();
      }, 150);
    } else {
      setIsError(true);
      setShake(true);
      setTimeout(() => {
        setEnteredPin('');
        setShake(false);
      }, 700);
    }
  };

  // Allow physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enteredPin]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-between px-6 py-10 select-none text-white">
      {/* Brand & Security Header */}
      <div className="flex flex-col items-center text-center mt-6 space-y-3">
        <div className="flex items-center gap-1.5 bg-[#E30613] text-white px-3 py-1 rounded-xl font-bold text-xs tracking-wider shadow-md">
          <span>BONPREU</span>
          <span className="text-amber-300 font-extrabold text-[10px]">·</span>
          <span className="text-amber-300">ESCLAT</span>
        </div>

        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl mt-2">
          <Lock className="w-8 h-8 text-amber-300" />
        </div>

        <div>
          <h1 className="text-xl font-black font-display tracking-tight text-white">
            Descomptes d'Aitor i Xènia
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accés privat protegit. Introdueix el codi PIN per accedir als vales.
          </p>
        </div>
      </div>

      {/* PIN Dots Display */}
      <div className="flex flex-col items-center my-6">
        <div className={`flex items-center gap-4 ${shake ? 'animate-bounce text-red-500' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < enteredPin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isError
                    ? 'border-red-500 bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                    : isFilled
                    ? 'border-[#E30613] bg-[#E30613] scale-115 shadow-md shadow-red-500/40'
                    : 'border-slate-500 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {isError && (
          <p className="text-xs text-red-400 font-semibold mt-3 animate-pulse flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>PIN incorrecte. Torna-ho a provar.</span>
          </p>
        )}
      </div>

      {/* Numeric Keypad (Ergonomic Touch Circles) */}
      <div className="w-full max-w-[280px] grid grid-cols-3 gap-y-4 gap-x-6 mb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(num)}
            className="w-18 h-18 mx-auto rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-92 border border-white/10 flex items-center justify-center text-2xl font-bold font-display text-white transition-all duration-150 backdrop-blur-sm cursor-pointer shadow-sm"
          >
            {num}
          </button>
        ))}

        {/* Empty placeholder */}
        <div className="w-18 h-18" />

        {/* Digit 0 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="w-18 h-18 mx-auto rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-92 border border-white/10 flex items-center justify-center text-2xl font-bold font-display text-white transition-all duration-150 backdrop-blur-sm cursor-pointer shadow-sm"
        >
          0
        </button>

        {/* Backspace Delete */}
        <button
          type="button"
          onClick={handleBackspace}
          className="w-18 h-18 mx-auto rounded-full bg-white/5 hover:bg-white/15 active:bg-white/25 active:scale-92 border border-white/5 flex items-center justify-center text-slate-300 transition-all duration-150 cursor-pointer"
          aria-label="Esborrar dígit"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Security Footer Notice */}
      <div className="text-center text-[11px] text-slate-500 pb-safe">
        <span>Ús exclusiu per a Aitor i Xènia · Bonpreu Esclat</span>
      </div>
    </div>
  );
};
