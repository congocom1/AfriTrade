import React from 'react';
import { useTranslation } from 'react-i18next';

/* Status colours come from the semantic ramps only: waiting → warning,
   moving → info, done → success, failed → destructive, inactive → neutral. */
const STYLES = {
  PENDING: 'bg-warning-100 text-warning-900',
  AUTHORIZED: 'bg-info-100 text-info-900',
  PAID: 'bg-success-100 text-success-900',
  CONFIRMED: 'bg-info-100 text-info-900',
  PROCESSING: 'bg-info-100 text-info-900',
  AWAITING_CUSTOMER_APPROVAL: 'bg-warning-100 text-warning-900',
  PACKING: 'bg-info-100 text-info-900',
  READY_FOR_PICKUP: 'bg-info-100 text-info-900',
  PICKED_UP: 'bg-info-100 text-info-900',
  SHIPPED: 'bg-info-100 text-info-900',
  IN_TRANSIT: 'bg-info-100 text-info-900',
  OUT_FOR_DELIVERY: 'bg-info-100 text-info-900',
  DELIVERED: 'bg-success-100 text-success-900',
  FAILED: 'bg-destructive-100 text-destructive-900',
  RETURNED: 'bg-warning-100 text-warning-900',
  CANCELLED: 'bg-muted text-muted-foreground',
  REFUNDED: 'bg-success-100 text-success-900',
  PARTIALLY_REFUNDED: 'bg-info-100 text-info-900',
  REQUESTED: 'bg-warning-100 text-warning-900',
  UNDER_REVIEW: 'bg-info-100 text-info-900',
  APPROVED: 'bg-success-100 text-success-900',
  REJECTED: 'bg-destructive-100 text-destructive-900',
  RETURN_IN_TRANSIT: 'bg-info-100 text-info-900',
  CLOSED: 'bg-muted text-muted-foreground',
  OPEN: 'bg-warning-100 text-warning-900',
  INVESTIGATING: 'bg-info-100 text-info-900',
  ESCALATED: 'bg-destructive-100 text-destructive-900',
  ACTIVE: 'bg-success-100 text-success-900',
  PENDING_REVIEW: 'bg-warning-100 text-warning-900',
  DRAFT: 'bg-muted text-muted-foreground',
  PUBLISHED: 'bg-success-100 text-success-900',
  SUSPENDED: 'bg-destructive-100 text-destructive-900',
  ARCHIVED: 'bg-muted text-muted-foreground',
  SUBMITTED: 'bg-warning-100 text-warning-900',
  RESPONDED: 'bg-info-100 text-info-900',
  ACCEPTED: 'bg-success-100 text-success-900',
  DECLINED: 'bg-destructive-100 text-destructive-900',
  EXPIRED: 'bg-muted text-muted-foreground',
};

const LABELS = {
  PENDING: 'En attente',
  AUTHORIZED: 'Autorisé',
  PAID: 'Payé',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  AWAITING_CUSTOMER_APPROVAL: 'Validation client requise',
  PACKING: 'Emballage en cours',
  READY_FOR_PICKUP: 'Prêt au retrait',
  PICKED_UP: 'Pris en charge',
  SHIPPED: 'Expédiée',
  IN_TRANSIT: 'En transit',
  OUT_FOR_DELIVERY: 'En livraison',
  DELIVERED: 'Livré',
  FAILED: 'Échec',
  RETURNED: 'Retourné',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
  PARTIALLY_REFUNDED: 'Remb. partiel',
  REQUESTED: 'Demandé',
  UNDER_REVIEW: 'En examen',
  APPROVED: 'Approuvé',
  REJECTED: 'Refusé',
  RETURN_IN_TRANSIT: 'Retour en cours',
  CLOSED: 'Clôturé',
  OPEN: 'Ouvert',
  INVESTIGATING: 'Enquête',
  ESCALATED: 'Escaladé',
  ACTIVE: 'Actif',
  PENDING_REVIEW: 'À valider',
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  SUSPENDED: 'Suspendu',
  ARCHIVED: 'Archivé',
  SUBMITTED: 'Request submitted',
  RESPONDED: 'Supplier responded',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
};

export default function StatusBadge({ status, className = '', variant = 'default' }) {
  const { t } = useTranslation();
  if (!status) return null;
  const key = String(status).toUpperCase();
  const label = t(`status.${key}`, { defaultValue: LABELS[key] || status });

  const paperStyles = {
    PENDING: 'bg-warning-100 text-warning-900',
    PAID: 'bg-success-100 text-success-900',
    DELIVERED: 'bg-success-100 text-success-900',
    PUBLISHED: 'bg-success-100 text-success-900',
    ACTIVE: 'bg-success-100 text-success-900',
    APPROVED: 'bg-success-100 text-success-900',
    ACCEPTED: 'bg-success-100 text-success-900',
    CLOSED: 'bg-muted text-muted-foreground',
    DRAFT: 'bg-muted text-muted-foreground',
    ARCHIVED: 'bg-muted text-muted-foreground',
    EXPIRED: 'bg-muted text-muted-foreground',
    DEFAULT: 'bg-secondary text-foreground',
  };

  if (variant === 'paper') {
    const style = paperStyles[key] || paperStyles.DEFAULT;
    return <span className={`paper-badge ${style} ${className}`}>{label}</span>;
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STYLES[key] || 'bg-secondary text-foreground'} ${className}`}>
      {label}
    </span>
  );
}