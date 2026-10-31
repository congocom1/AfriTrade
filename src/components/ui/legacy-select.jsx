import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Bridge existing native-select call sites onto the shadcn/Radix primitives.
// Keep the onChange({ target: { value } }) contract while we modernize forms.
// Children describe options; they are never mounted as native <select>/<option>.
const EMPTY = '__afritrade_empty_choice__';
const asValue = value => String(value ?? '');
const emptyOptionLabel = children => {
  for (const node of React.Children.toArray(children)) {
    if (!React.isValidElement(node)) continue;
    if (node.type === React.Fragment || node.type === 'optgroup') {
      const nested = emptyOptionLabel(node.props.children);
      if (nested) return nested;
    }
    if (node.type === 'option' && asValue(node.props.value) === '') {
      return node.props.label || labelText(node.props.children);
    }
  }
  return '';
};
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
  // Radix's hidden native select needs an actual empty string for required
  // validation. Keep EMPTY only for the clickable clear choice: Radix forbids
  // SelectItem value="", but a root value="" correctly shows a placeholder.
  const selection = value == null ? undefined : asValue(value);
  const initial = defaultValue == null ? undefined : asValue(defaultValue);
  const handleChange = next => {
    const selected = next === EMPTY ? '' : next;
    onChange?.({ target: { value: selected, name }, currentTarget: { value: selected, name } });
  };
  const visiblePlaceholder = placeholder || emptyOptionLabel(children) || 'Sélectionner';
  return (
    <Select value={selection} defaultValue={initial} onValueChange={handleChange} name={name} required={required} disabled={disabled}>
      <SelectTrigger
        id={id} disabled={disabled} onBlur={onBlur} onFocus={onFocus}
        className={cn('min-h-11 min-w-0 text-left', className)}
        {...props}
      >
        <SelectValue placeholder={visiblePlaceholder} />
      </SelectTrigger>
      <SelectContent>{toSelectItems(children)}</SelectContent>
    </Select>
  );
}
