import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Bridge existing native-select call sites onto the shadcn/Radix primitives.
// Keep the onChange({ target: { value } }) contract while we modernize forms.
// Children describe options; they are never mounted as native <select>/<option>.
const EMPTY = '__afritrade_empty_choice__';
const asValue = value => String(value ?? '');
const labelText = children => React.Children.toArray(children).map(node => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  return React.isValidElement(node) ? labelText(node.props.children) : '';
}).join('');

export function toSelectItems(children) {
  return React.Children.toArray(children).flatMap(node => {
    if (!React.isValidElement(node)) return [];
    if (node.type === React.Fragment) return toSelectItems(node.props.children);
    if (node.type === 'optgroup') return [
      <SelectGroup key={node.key || node.props.label}>
        <SelectLabel>{node.props.label}</SelectLabel>
        {toSelectItems(node.props.children)}
      </SelectGroup>,
    ];
    if (node.type !== 'option') return [];
    const value = node.props.value == null ? labelText(node.props.children) : asValue(node.props.value);
    return [
      <SelectItem key={node.key || (value === '' ? EMPTY : value)} value={value === '' ? EMPTY : value} disabled={node.props.disabled}>
        {node.props.label || labelText(node.props.children) || '—'}
      </SelectItem>,
    ];
  });
}

export default function LegacySelect({ children, value, defaultValue, onChange, onBlur, onFocus, className, id, name, required, disabled, placeholder, ...props }) {
  const selection = value == null ? undefined : (asValue(value) || EMPTY);
  const initial = defaultValue == null ? undefined : (asValue(defaultValue) || EMPTY);
  const handleChange = next => onChange?.({ target: { value: next === EMPTY ? '' : next, name }, currentTarget: { value: next === EMPTY ? '' : next, name } });
  return (
    <Select value={selection} defaultValue={initial} onValueChange={handleChange} name={name} required={required} disabled={disabled}>
      <SelectTrigger
        id={id} disabled={disabled} onBlur={onBlur} onFocus={onFocus}
        className={cn('min-h-11 min-w-0 text-left', className)}
        {...props}
      >
        <SelectValue placeholder={placeholder || 'Sélectionner'} />
      </SelectTrigger>
      <SelectContent>{toSelectItems(children)}</SelectContent>
    </Select>
  );
}
