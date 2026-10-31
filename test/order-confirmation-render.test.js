import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const original = readFileSync('src/pages/OrderConfirmation.jsx', 'utf8');
const withoutImports = original.replace(/^import .*;\s*$/gm, '');
assert.doesNotMatch(withoutImports, /^import /m);

const state = { values: [] };
const dumbIcon = props => React.createElement('svg', { role: 'presentation', ...props });
const deps = {
  React,
  useEffect: () => {},
  useState: initial => [state.values.shift() ?? initial, () => {}],
  useParams: () => ({ number: 'DOES-NOT-EXIST' }),
  useTranslation: () => ({ t: key => key }),
  // eslint-disable-next-line react/prop-types -- lightweight router stub in an isolated SSR test
  Link: props => React.createElement('a', { href: props.to }, props.children),
  CheckCircle2: dumbIcon, Clock: dumbIcon, XCircle: dumbIcon,
  Package: dumbIcon, Truck: dumbIcon, MapPin: dumbIcon, Wallet: dumbIcon,
  getProfile: () => ({}), lookupOrder: async () => null,
  Image: () => null, StatusBadge: () => null,
  formatUsdAmount: value => String(value), formatDateTime: value => String(value),
  SHIPMENT_STATUS_LABELS: {}, BackButton: () => null,
};
globalThis.__orderConfirmationRenderDeps = deps;
const preamble = `const { React, useEffect, useState, useParams, useTranslation, Link, CheckCircle2, Clock, XCircle, Package, Truck, MapPin, Wallet, getProfile, lookupOrder, Image, StatusBadge, formatUsdAmount, formatDateTime, SHIPMENT_STATUS_LABELS, BackButton } = globalThis.__orderConfirmationRenderDeps;\n`;
const compiled = ts.transpileModule(preamble + withoutImports, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
const { default: Component } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

describe('order confirmation rendering', () => {
  it('renders not-found safely without referencing uninitialized payment state', () => {
    state.values = [null, [], false, true];
    const html = renderToStaticMarkup(React.createElement(Component));
    assert.match(html, /orderConfirmation\.notFound/);
    assert.match(html, /orderConfirmation\.backHome/);
  });
  it('renders a loading state while its first lookup runs', () => {
    state.values = [null, [], true, false];
    assert.match(renderToStaticMarkup(React.createElement(Component)), /animate-pulse/);
  });
});
