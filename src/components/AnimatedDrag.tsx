// src/components/AnimatedDrag.tsx
import { useRef, useEffect, useState } from 'react';
import { useMotionValue, useSpring, animate } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

/**
 * Draggable component that follows the Apple Motion guidelines:
 *   * 1:1 tracking with pointer‑capture
 *   * Velocity hand‑off to spring on release
 *   * Interruptibility – can be grabbed mid‑motion and reversed
 *   * Respect prefers‑reduced‑motion
 */
export function Draggable({
  children,
  className = '',
  style,
  ...props
}) {
  const prefersReduced = useReducedMotion();
  const ref = useRef(null);
  const [isDragging, setDragging] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const [lastTouch, setLastTouch] = useState<[{x:number, y:number, t:number}]>([]);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const onPointerDown = (e: PointerEvent) => {
    if (!ref.current) return;
    ref.current.setPointerCapture(e.pointerId);
    setDragging(true);
    setLastTouch([{ x: e.clientX, y: e.clientY, t: Date.now() }]);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastTouch[0].x;
    const deltaY = e.clientY - lastTouch[0].y;
    x.set(deltaX);
    y.set(deltaY);
    setLastTouch([{ x: e.clientX, y: e.clientY, t: Date.now() }]);
  };

  const onPointerUp = () => {
    setDragging(false);
    // compute velocity
    const now = Date.now();
    const [t0] = lastTouch;
    const elapsed = now - t0.t || 16; // avoid division by zero
    const velX = (x.get() - t0.x) / (elapsed / 1000);
    const velY = (y.get() - t0.y) / (elapsed / 1000);
    // apply spring with initial velocity
    springX.stop();
    springY.stop();
    animate(springX, 0, { type: 'spring', velocity: velX, stiffness: 300, damping: 30 });
    animate(springY, 0, { type: 'spring', velocity: velY, stiffness: 300, damping: 30 });
  };

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
    node.addEventListener('pointerleave', onPointerUp);
    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointerleave', onPointerUp);
    };
  }, [isDragging, lastTouch]);

  const transformStyle = {
    transform: `translate(${springX.get()}px, ${springY.get()}px)`,
  };

  if (prefersReduced) {
    return (
      <div ref={ref} className={className} style={style} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ ...style, ...transformStyle }} {...props}>
      {children}
    </div>
  );
}
