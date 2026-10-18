import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogSource = fs.readFileSync(path.join(repo, 'docs/catalog.js'), 'utf8');
const appSource = fs.readFileSync(path.join(repo, 'docs/app.js'), 'utf8');
const cases = JSON.parse(fs.readFileSync(path.join(repo, 'tests/expected.json'), 'utf8'));
const unitKey = value => String(value || '').toLowerCase().trim().replace(/\.$/, '').replace(/\s+/g, ' ')
  .replace(/^(?:pc|pcs|piece|pieces)$/, 'pcs')
  .replace(/^(?:no|nos|no's|number|numbers)$/, 'nos')
  .replace(/^(?:m|mt|mtr|mtrs|meter|meters|metre|metres)$/, 'm')
  .replace(/^(?:kg|kgs|kilogram|kilograms)$/, 'kg')
  .replace(/^pairs?$/, 'pair').replace(/^box(?:es)?$/, 'box')
  .replace(/^packs?$/, 'pack').replace(/^coils?$/, 'coil')
  .replace(/^cartons?$/, 'carton').replace(/^sets?$/, 'set')
  .replace(/^lengths?$/, 'length').replace(/^drums?$/, 'drum');

function makeDom(rfqText, fetchImpl = async () => { throw new Error('unexpected network request'); }) {
  const elements = new Map();
  const getElement = selector => {
    if (!elements.has(selector)) {
      elements.set(selector, {
        value: selector === '#rfq-input' ? rfqText : '', textContent: '', innerHTML: '', disabled: false, checked: false,
        classList: { toggle() {}, add() {}, remove() {} }, addEventListener() {}, scrollIntoView() {}
      });
    }
    return elements.get(selector);
  };
  const document = {
    querySelector: getElement,
    querySelectorAll: () => [],
    createElement: () => ({ click() {}, remove() {}, setAttribute() {} }),
    body: { appendChild() {} }
  };
  const context = vm.createContext({
    console, document, window: {}, fetch: fetchImpl, Date, Number, String, Array, Object, JSON, Math, RegExp, Error, Promise,
    setTimeout, clearTimeout
  });
  vm.runInContext(catalogSource, context, { filename: 'catalog.js' });
  vm.runInContext(appSource, context, { filename: 'app.js' });
  vm.runInContext('globalThis.__renderItems = renderItems; renderItems = function() {};', context);
  return { context, getElement };
}

function modelResponse(spec) {
  return {
    items: spec.items.map((want, index) => {
      let matchedSku = want.sku;
      let unit = want.unit;
      if (spec.id === '05-part-number-typo') matchedSku = 'BRG-6204Z';
      if (spec.id === '10-markdown-table' && index === 0) unit = 'boxes of 100';
      if (spec.id === '15-lowercase-sku') matchedSku = '6205zz';
      if (spec.id === '19-separator-variant-sku') matchedSku = 'BRG 6306 2RS';
      if (['02-hinglish', '17-motor-alternatives', '18-deadline-and-quantity', '24-nos-pcs-pair-coil'].includes(spec.id) && unit === 'nos') unit = "no's";
      if (spec.id === '04-mixed-units' && unit === 'm') unit = 'mtrs';
      if (spec.id === '04-mixed-units' && unit === 'kg') unit = 'kgs';
      if (spec.id === '04-mixed-units' && unit === 'pair') unit = 'pairs';
      if (spec.id === '13-mtr-alias') unit = 'mtr';
      if (spec.id === '14-decimal-quantity') unit = 'kgs';
      if (spec.id === '21-semicolon-table' && unit === 'pack') unit = 'packs';
      if (spec.id === '21-semicolon-table' && unit === 'pair') unit = 'pairs';
      if (spec.id === '24-nos-pcs-pair-coil' && unit === 'pcs') unit = 'pieces';
      if (spec.id === '24-nos-pcs-pair-coil' && unit === 'pair') unit = 'pairs';
      if (spec.id === '24-nos-pcs-pair-coil' && unit === 'coil') unit = 'coils';
      if (spec.id === '25-wrapped-multiline' && unit === 'carton') unit = 'cartons';
      if (spec.id === '25-wrapped-multiline' && unit === 'length') unit = 'lengths';

      const flags = [];
      if ((spec.flags || []).includes('deadline')) flags.push('required delivery deadline');
      if ((spec.flags || []).includes('no catalog match')) flags.push('no catalog match; do not substitute');
      if ((spec.flags || []).includes('unit mismatch')) flags.push('unit mismatch; confirm commercial basis');
      if ((spec.flags || []).includes('stock')) flags.push('check stock availability');
      return {
        raw_text: want.match,
        item_name: want.match,
        quantity: index % 2 === 0 && want.quantity != null ? String(want.quantity) : want.quantity,
        unit,
        specs: want.match,
        matched_sku: matchedSku,
        match_confidence: matchedSku ? 'high' : 'none',
        flags
      };
    })
  };
}

function checkReplay(spec, actual) {
  const items = actual.items;
  assert.equal(items.length, spec.items.length, `${spec.id}: line count`);
  const unused = new Set(items.map((_, index) => index));
  for (const expected of spec.items) {
    const found = [...unused].find(index => {
      const item = items[index];
      return `${item.item_name} ${item.raw_text} ${item.specs}`.toLowerCase().includes(expected.match.toLowerCase());
    });
    assert.notEqual(found, undefined, `${spec.id}: missing line containing ${expected.match}`);
    unused.delete(found);
    const item = items[found];
    assert.equal(item.quantity ?? null, expected.quantity ?? null, `${spec.id}: quantity for ${expected.match}`);
    assert.equal(unitKey(item.unit), unitKey(expected.unit), `${spec.id}: unit for ${expected.match}`);
    assert.equal(item.matched_sku || null, expected.sku ?? null, `${spec.id}: SKU for ${expected.match}`);
  }
  const allFlags = items.flatMap(item => item.flags).join(' ').toLowerCase().replace(/_/g, ' ');
  for (const flag of spec.flags || []) {
    if (flag === 'deadline') assert.match(allFlags, /deadline/ , `${spec.id}: deadline flag`);
    else if (flag === 'missing quantity') assert.match(allFlags, /missing quantity/, `${spec.id}: missing quantity flag`);
    else if (flag === 'no catalog match') assert.match(allFlags, /no catalog match|suggested match not in catalog/, `${spec.id}: no-match flag`);
    else if (flag === 'unit mismatch') assert.match(allFlags, /unit mismatch/, `${spec.id}: unit mismatch flag`);
    else if (flag === 'SKU normalized') assert.match(allFlags, /sku normalized/, `${spec.id}: normalized SKU flag`);
    else if (flag === 'stock') assert.match(allFlags, /stock/, `${spec.id}: stock flag`);
  }
  if (spec.items.some(item => item.quantity == null)) assert.match(allFlags, /missing quantity/);
}

for (const spec of cases) {
  test(`replays ${spec.id} through the extraction path`, async () => {
    const rfq = fs.readFileSync(path.join(repo, 'tests/enquiries', `${spec.id}.txt`), 'utf8');
    const payload = modelResponse(spec);
    let capturedPrompt = '';
    const fetchImpl = async (url, options) => {
      assert.equal(url, 'https://text.pollinations.ai/');
      const request = JSON.parse(options.body);
      capturedPrompt = request.messages[1].content;
      return { ok: true, status: 200, text: async () => `Model response:\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\`` };
    };
    const { context } = makeDom(rfq, fetchImpl);
    await vm.runInContext('extract()', context);
    const result = JSON.parse(vm.runInContext('JSON.stringify({items: state.items, status: document.querySelector("#extract-status").textContent})', context));
    assert.match(result.status, /Extraction complete/);
    assert.ok(capturedPrompt.includes(rfq.trim()), `${spec.id}: full RFQ appears in prompt`);
    assert.ok(capturedPrompt.endsWith('RFQ TEXT END'), `${spec.id}: explicit end marker`);
    checkReplay(spec, result);
  });
}

test('rejects an oversized enquiry without silently truncating it', () => {
  const { context, getElement } = makeDom('x'.repeat(24001));
  vm.runInContext('extract()', context);
  assert.match(getElement('#extract-status').textContent, /no text was omitted/);
  assert.equal(getElement('#btn-extract').disabled, false);
});

test('parses fenced JSON and ignores braces inside quoted values', () => {
  const { context } = makeDom('test');
  const raw = 'Here is the result: ```json\n{"items":[{"item_name":"bearing {sealed}","quantity":1}]}\n```';
  const parsed = JSON.parse(vm.runInContext(`JSON.stringify(parseModelResponse(${JSON.stringify(raw)}))`, context));
  assert.equal(parsed.items[0].item_name, 'bearing {sealed}');
});

test('normalizes a unique one-character SKU typo and refuses broad partials', () => {
  const { context } = makeDom('test');
  const result = JSON.parse(vm.runInContext(`JSON.stringify([
    normalizeSku('BRG-6204Z'), normalizeSku('BRG'), normalizeSku('M12X50'), normalizeSku('6205zz')
  ])`, context));
  assert.deepEqual(result.map(item => item.sku), ['BRG-6204ZZ', '', '', 'BRG-6205ZZ']);
  assert.equal(result[0].snapped, true);
});

test('requires the review acknowledgment again before PDF save and paginates long flags', () => {
  class MockPdf {
    constructor() {
      this.lines = [];
      this.pages = 1;
      this.lastAutoTable = null;
      this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    }
    setFontSize() {}
    setTextColor() {}
    splitTextToSize(text, width) {
      const max = Math.max(20, Math.floor(width / 2));
      const words = String(text).split(/\s+/);
      const lines = [];
      let line = '';
      for (const word of words) {
        if (line && line.length + word.length + 1 > max) { lines.push(line); line = word; }
        else line += (line ? ' ' : '') + word;
      }
      if (line) lines.push(line);
      return lines;
    }
    text(value, x, y) { this.lines.push({ value: String(value), x, y }); }
    autoTable() { this.lastAutoTable = { finalY: 286 }; }
    addPage() { this.pages += 1; }
    save(name) { this.saved = name; }
  }
  const { context, getElement } = makeDom('test');
  context.__MockPdf = MockPdf;
  vm.runInContext('window.jspdf = { jsPDF: class extends globalThis.__MockPdf {} };', context);
  vm.runInContext('state.items = Array.from({length: 80}, (_, i) => ({ raw_text: "", item_name: "Synthetic line " + i, quantity: null, unit: "", specs: "", matched_sku: "", match_confidence: "none", flags: ["missing_quantity"] }));', context);
  vm.runInContext('downloadPdf()', context);
  assert.equal(getElement('#btn-download').disabled, true);
  assert.equal(context.__lastPdf?.saved, undefined);

  vm.runInContext('window.jspdf = { jsPDF: class extends globalThis.__MockPdf { constructor() { super(); globalThis.__lastPdf = this; } } };', context);
  getElement('#chk-reviewed').checked = true;
  vm.runInContext('downloadPdf()', context);
  assert.ok(context.__lastPdf.pages > 1, 'long flag list should use additional pages');
  assert.equal(context.__lastPdf.saved, 'QP-DRAFT-quote-draft.pdf');
  assert.ok(context.__lastPdf.lines.some(line => line.value.includes('80')) || context.__lastPdf.lines.some(line => line.value.includes('Synthetic line 79')));
});


test('escapes model-provided HTML in item names and flags', () => {
  const { context, getElement } = makeDom('test');
  vm.runInContext(`state.items = [{ raw_text: '', item_name: '<img src=x onerror=alert(1)>', quantity: 1, unit: 'pcs', specs: '', matched_sku: '', match_confidence: 'none', flags: ['<svg onload=alert(2)>'] }];`, context);
  vm.runInContext('globalThis.__renderItems()', context);
  const html = getElement('#items-table').innerHTML;
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;svg/);
  assert.doesNotMatch(html, /<img|<svg/);
});

test('turns an unparseable model quantity into a null quantity with flags', () => {
  const { context } = makeDom('test');
  const result = JSON.parse(vm.runInContext(`JSON.stringify(normalizeExtractedItems([{
    item_name: 'Synthetic hose clamp', quantity: 'five', unit: 'pieces', matched_sku: null, flags: []
  }]))`, context))[0];
  assert.equal(result.quantity, null);
  assert.equal(result.unit, 'pcs');
  assert.ok(result.flags.some(flag => flag.includes('invalid quantity')));
  assert.ok(result.flags.includes('missing_quantity'));
});

test('withholds a sample price when the requested unit differs from catalog pricing', () => {
  const { context } = makeDom('test');
  const line = JSON.parse(vm.runInContext(`(() => {
    state.items = [{ raw_text: '', item_name: 'GI pipe', quantity: 80, unit: 'm', specs: '1 inch', matched_sku: 'PIP-GI-1IN', match_confidence: 'high', flags: [] }];
    const row = quoteLines()[0];
    return JSON.stringify({ unitMismatch: row.unitMismatch, unitPrice: row.unitPrice, lineTotal: row.lineTotal });
  })()`, context));
  assert.equal(line.unitMismatch, true);
  assert.equal(line.unitPrice, null);
  assert.equal(line.lineTotal, null);
});

test('clears stale extracted rows after a provider authorization error', async () => {
  const { context, getElement } = makeDom('synthetic RFQ', async () => ({ ok: false, status: 402, text: async () => '' }));
  vm.runInContext(`state.items = [{ item_name: 'Old line', quantity: 1, unit: 'pcs', matched_sku: '', flags: [] }];`, context);
  await vm.runInContext('extract()', context);
  const state = JSON.parse(vm.runInContext('JSON.stringify(state.items)', context));
  assert.equal(state.length, 0);
  assert.match(getElement('#extract-status').textContent, /HTTP 402/);
});


test('clears generated flags once a reviewer fixes quantity, unit and catalog match', () => {
  const { context } = makeDom('test');
  const row = {
    querySelector(selector) {
      const values = { '.f-name': 'GI pipe', '.f-specs': '1 inch class B', '.f-qty': '10', '.f-unit': 'length', '.match-sel': 'PIP-GI-1IN' };
      return { value: values[selector] ?? '' };
    }
  };
  context.document.querySelectorAll = selector => selector === '#items-table tbody tr' ? [row] : [];
  vm.runInContext(`state.items = [{ raw_text: '', item_name: 'GI pipe', quantity: null, unit: '', specs: '', matched_sku: '', match_confidence: 'none', flags: [
    'missing_quantity', 'missing unit; please confirm', 'invalid quantity; please confirm',
    'unit mismatch: requested m; catalog unit is length', 'quantity exceeds sample stock', 'suggested match not in catalog'
  ] }];`, context);
  vm.runInContext('syncItemFromInputs()', context);
  const item = JSON.parse(vm.runInContext('JSON.stringify(state.items[0])', context));
  assert.equal(item.quantity, 10);
  assert.equal(item.unit, 'length');
  assert.equal(item.matched_sku, 'PIP-GI-1IN');
  assert.deepEqual(item.flags, []);
  const open = JSON.parse(vm.runInContext('JSON.stringify(collectOpenFlags(quoteLines()))', context));
  assert.deepEqual(open, []);
});
