import React from 'react';
import * as FocusScopePrimitive from '@radix-ui/react-focus-scope';
import { cn } from '@/lib/utils';

/**
 * FocusScope wrapper for Radix UI modals
 * Ensures focus is trapped within the modal when open
 * This addresses P0 A-02: Focus trap for modals
 */
// Radix clones this element through SlotClone and passes a ref, so it has to
// forward it: a plain function component drops the ref and the focus trap
// never attaches to the modal container.
export const FocusScope = React.forwardRef(function FocusScope(
  { className, children, ...props },
  ref
) {
  return (
    <FocusScopePrimitive.Root
      ref={ref}
      className={cn(className)}
      {...props}
    >
      {children}
    </FocusScopePrimitive.Root>
  );
});

FocusScope.displayName = FocusScopePrimitive.Root.displayName;