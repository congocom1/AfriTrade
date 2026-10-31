/** Browser history index increases on PUSH/forward and decreases on back. */
export function navigationDirection(previousIndex, nextIndex, navigationType) {
  if (Number.isInteger(previousIndex) && Number.isInteger(nextIndex) && nextIndex !== previousIndex) {
    return nextIndex > previousIndex ? 1 : -1;
  }
  return navigationType === 'POP' ? -1 : navigationType === 'REPLACE' ? 0 : 1;
}

export const routeMotion = {
  initial: direction => ({ opacity: 0, x: direction * 22 }),
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: direction => ({ opacity: 0, x: direction * -22, transition: { duration: 0.16, ease: 'easeIn' } }),
};
