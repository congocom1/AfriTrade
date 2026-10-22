import { Store, Sparkles, Truck, BriefcaseBusiness } from 'lucide-react';
import { WORKSPACES } from '@/lib/roles';

const ICONS = {
  '/seller': Store,
  '/creator': Sparkles,
  '/courier': Truck,
  '/employee': BriefcaseBusiness,
};

/**
 * Workspace entries with their icon, ready for the navigation surfaces (top bar
 * account menu and mobile drawer). Both surfaces render the same list so an
 * administrator always reaches every workspace from either one.
 */
export const WORKSPACE_ITEMS = WORKSPACES.map((workspace) => ({
  ...workspace,
  icon: ICONS[workspace.path],
}));
