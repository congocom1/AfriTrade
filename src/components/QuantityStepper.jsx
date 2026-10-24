import React, { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const btn = 'min-h-11 min-w-11 h-12 w-12 p-3';
  // The stepper keeps its own value so a tap shows immediately, even while the
  // parent is still waiting on an async update. The parent's value stays
  // authoritative: whenever it changes, the display follows it.
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  const commit = (next) => {
    if (next === display) return;
    setDisplay(next);
    const result = onChange?.(next);
    // An async parent that rejects rolls the display back to the confirmed value.
    if (result && typeof result.then === 'function') result.catch(() => setDisplay(value));
  };

  return (
    <div className="inline-flex items-center rounded-full border border-border/60 bg-card/90 backdrop-blur-sm" role="group" aria-label="Quantité">
      <button
        type="button"
        aria-label="Diminuer la quantité"
        onClick={() => commit(Math.max(min, display - 1))}
        className={`${btn} flex items-center justify-center rounded-l-full disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-75 ease-out active:scale-90`}
        disabled={display <= min}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className={`min-w-8 px-2 text-center font-semibold tabular-nums ${size === 'sm' ? 'text-xs' : 'text-sm'}`} aria-live="polite">
        {display}
      </span>
      <button
        type="button"
        aria-label="Augmenter la quantité"
        onClick={() => commit(Math.min(max, display + 1))}
        className={`${btn} flex items-center justify-center rounded-r-full disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-75 ease-out active:scale-90`}
        disabled={display >= max}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}