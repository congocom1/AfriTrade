import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import ts from 'typescript';

const components = Object.fromEntries(['Select', 'SelectContent', 'SelectGroup', 'SelectItem', 'SelectLabel', 'SelectTrigger', 'SelectValue']
  .map(name => [name, function FakeRadixSelect(props) { return React.createElement('div', props, props.children); }]));
globalThis.__webviewSelectDeps = { React, components, cn: (...parts) => parts.filter(Boolean).join(' ') };
const source = readFileSync('src/components/ui/legacy-select.jsx', 'utf8').replace(/^import .*;\r?\n/gm, '');
const preamble = 'const { React, components, cn } = globalThis.__webviewSelectDeps; const { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } = components;\n';
const compiled = ts.transpileModule(preamble + source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
const { default: LegacySelect, toSelectItems } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

describe('shadcn select compatibility adapter', () => {
  it('retains option choices, disabled items and grouped options', () => {
    const options = toSelectItems([
      React.createElement('option', { key: 'none', value: '' }, 'All'),
      React.createElement('optgroup', { key: 'g', label: 'Locations' }, [
        React.createElement('option', { key: 'a', value: 'a' }, 'Atlanta'),
        React.createElement('option', { key: 'b', value: 'b', disabled: true }, 'Boston'),
      ]),
    ]);
    assert.equal(options[0].props.value, '__afritrade_empty_choice__');
    assert.equal(options[1].type, components.SelectGroup);
    const members = React.Children.toArray(options[1].props.children);
    assert.equal(members[1][0]?.props?.value, undefined); // arrays are flattened by React.Children
    assert.ok(React.Children.toArray(options[1].props.children).some(child => child.type === components.SelectItem && child.props.value === 'a'));
    assert.ok(React.Children.toArray(options[1].props.children).some(child => child.type === components.SelectItem && child.props.value === 'b' && child.props.disabled));
  });
  it('required fields preserve their true empty value and the first blank option label', () => {
    const result = LegacySelect({ value: '', name: 'product_id', required: true, children: [
      React.createElement('option', { value: '', key: 'empty' }, 'Choose product'),
      React.createElement('option', { value: 'p1', key: 'p1' }, 'Product 1'),
    ] });
    assert.equal(result.props.value, '', 'Radix must receive a genuinely empty value for native form validation');
    assert.equal(result.props.required, true);
    const trigger = React.Children.toArray(result.props.children)[0];
    const value = React.Children.toArray(trigger.props.children)[0];
    assert.equal(value.props.placeholder, 'Choose product');
    const unchecked = LegacySelect({ defaultValue: '', children: [], required: true });
    assert.equal(unchecked.props.defaultValue, '');
  });

  it('supports the legacy event.target.value change handler and empty option', () => {
    let selected;
    const result = LegacySelect({ value: 'fr', name: 'language', onChange: e => { selected = e.target.value; }, children: [
      React.createElement('option', { value: 'fr', key: 'fr' }, 'Français'),
      React.createElement('option', { value: '', key: 'empty' }, 'All'),
    ] });
    assert.equal(result.props.value, 'fr');
    result.props.onValueChange('en');
    assert.equal(selected, 'en');
    result.props.onValueChange('__afritrade_empty_choice__');
    assert.equal(selected, '');
  });
});
