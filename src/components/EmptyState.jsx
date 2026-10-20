import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({ icon: Icon = PackageOpen, title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <Icon aria-hidden="true" className="mb-3 h-9 w-9 text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {onAction && <Button type="button" onClick={onAction} className="mt-4">{actionLabel}</Button>}
      {!onAction && actionTo && (
        <Link to={actionTo} className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}