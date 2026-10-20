import { cloneElement, useId } from 'react';

export default function FormField({ label, hint, error, children, className = '' }) {
  const generatedId = useId();
  const id = children.props.id || generatedId;
  const describedBy = [children.props['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-xs font-medium">{label}{children.props.required && <span aria-hidden="true"> *</span>}</label>
      {cloneElement(children, { id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) || children.props['aria-invalid'] })}
      {hint && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
