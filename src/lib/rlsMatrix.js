/**
 * The access rules each entity declares, read as a role matrix.
 *
 * Row-Level Security lives with the entity definitions rather than in the
 * database; ACCESS_RULES is the extracted snapshot of those rules, one audience
 * list per operation.
 */
import { ACCESS_RULES } from '@/lib/rlsMatrixData';

/** The audiences a rule can grant, from widest to narrowest. */
export const ROLES = [
  { id: 'public', label: 'Tous', hint: 'Visiteurs non connectés compris' },
  { id: 'owner', label: 'Propriétaire', hint: 'Créateur de la fiche, enseigne, acheteur, vendeur ou livreur concerné' },
  { id: 'admin', label: 'Administrateur', hint: 'Comptes portant le rôle admin' },
];

export const OPERATIONS = [
  { id: 'read', label: 'Lire' },
  { id: 'create', label: 'Créer' },
  { id: 'update', label: 'Modifier' },
  { id: 'delete', label: 'Supprimer' },
];

const WRITE_OPERATIONS = ['create', 'update', 'delete'];

export const ENTITIES = Object.entries(ACCESS_RULES)
  .map(([name, access]) => ({ name, access }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** How many entities each audience can read, and how many it can change at all. */
export const ROLE_TOTALS = ROLES.map((role) => ({
  ...role,
  readable: ENTITIES.filter((entity) => entity.access.read?.includes(role.id)).length,
  writable: ENTITIES.filter((entity) =>
    WRITE_OPERATIONS.some((op) => entity.access[op]?.includes(role.id)),
  ).length,
}));