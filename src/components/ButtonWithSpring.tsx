import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function ButtonWithSpring({
  onClick,
  children,
  className = '',
  style,
  ...props
}) {
  const prefersReduced = useReducedMotion();

  const spring = {
    scale: 0.95,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 20,
      mass: 1,
    },
  };

  return (
    <motion.button
      whileTap={prefersReduced ? {} : spring}
      onClick={onClick}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default ButtonWithSpring;
