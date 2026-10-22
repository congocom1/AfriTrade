import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, LoaderCircle } from 'lucide-react';
import { REFRESH_THRESHOLD, pullDistance } from '@/lib/pullGesture';

/** Only starts at the top-level scroll origin; never hijacks horizontal rails. */
export default function usePullToRefresh(onRefresh, { disabled = false } = {}) {
  const start = useRef(null);
  const pulling = useRef(0);
  const mounted = useRef(true);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { i18n } = useTranslation();
  const french = i18n.language?.startsWith('fr');
  const reset = () => { start.current = null; pulling.current = 0; setDistance(0); };

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const onTouchStart = event => {
    if (disabled || refreshing || event.touches.length !== 1 ||
        !window.matchMedia('(pointer: coarse)').matches ||
        (document.scrollingElement?.scrollTop ?? window.scrollY) > 2 ||
        event.target?.closest?.('input, textarea, [role="slider"], [data-no-pull]')) return;
    const touch = event.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
  };
  const onTouchMove = event => {
    if (!start.current || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const amount = pullDistance(start.current, { x: touch.clientX, y: touch.clientY });
    if (amount !== pulling.current) {
      pulling.current = amount;
      if (mounted.current) setDistance(amount);
    }
  };
  const onTouchEnd = () => {
    const ready = !!start.current && pulling.current >= REFRESH_THRESHOLD;
    reset();
    if (!ready || disabled || refreshing) return;
    if (mounted.current) setRefreshing(true);
    Promise.resolve().then(onRefresh).catch(() => {}).finally(() => {
      if (mounted.current) setRefreshing(false);
    });
  };
  const handlers = { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: reset };
  const text = refreshing ? (french ? 'Actualisation…' : 'Refreshing…')
    : distance >= REFRESH_THRESHOLD ? (french ? 'Relâchez pour actualiser' : 'Release to refresh')
    : (french ? 'Tirez pour actualiser' : 'Pull to refresh');
  const indicator = distance > 0 || refreshing ? (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 overflow-hidden text-xs font-medium text-muted-foreground md:hidden"
      style={{ height: refreshing ? 40 : distance, opacity: refreshing ? 1 : Math.min(1, distance / 35) }}>
      {refreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowDown className="h-4 w-4" />}
      {text}
    </div>
  ) : null;
  return { handlers, indicator, refreshing };
}
