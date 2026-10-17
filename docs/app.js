/* QuotePilot prototype - client logic.
   Flow: paste RFQ -> AI extraction (serverless function) -> human review -> quote draft PDF. */

const state = { items: [], quoteMeta: {} };
const $ = (sel) => document.querySelector(sel);

function renderCatalog() {
  const rows = SAMPLE_CATALOG.map(c =>
    `<tr><td>${c.sku}</td><td>${c.name}</td><td>${c.spec}</td><td>${c.unit}</td><td>Rs ${c.price.toLocaleString('en-IN')}</td><td>${c.stock}</td></tr>`
  ).join('');
  $('#catalog-table').innerHTML = `<table><thead><tr><th>SKU</th><th>Item</th><th>Specification</th><th>Unit</th><th>List price</th><th>Stock</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function setStatus(msg, isError) {
  const el = $('#extract-status');
  el.textContent = msg || '';
  el.classList.toggle('error', !!isError);
}

function buildPrompt(rfqText) {
  const catalogLines = SAMPLE_CATALOG.map(c =>
    `${c.sku} | ${c.name} | ${c.spec} | unit:${c.unit} | price:${c.price} | stock:${c.stock}`
  ).join('\n');
  return `You are an RFQ extraction engine for an Indian industrial-supplies distributor.
Extract every requested line item from the customer's RFQ text and match each against the catalog.

Return STRICT JSON only, no prose, with this exact shape:
{"items":[{"raw_text":string,"item_name":string,"quantity":number|null,"unit":string|null,"specs":string,"matched_sku":string|null,"match_confidence":"high"|"medium"|"low"|"none","flags":string[]}]}

Rules:
- quantity null and a flag "missing_quantity" when the quantity is not stated.
- matched_sku null and match_confidence "none" when no catalog line is a reasonable match. NEVER invent a price for unmatched items.
- flags should note ambiguity, missing specs, unit mismatches, or deadline mentions.
- specs: capture size, grade, brand, voltage, material etc. as short text.

CATALOG:
${catalogLines}

RFQ TEXT:
${rfqText.slice(0, 8000)}`;
}

async function extract() {
  const rfqText = $('#rfq-input').value.trim();
  if (!rfqText) { setStatus('Paste an enquiry first, or load the sample.', true); return; }
  const btn = $('#btn-extract');
  btn.disabled = true; btn.textContent = 'Extracting...';
  setStatus('AI is reading the enquiry and matching the catalog. This can take 10-30 seconds.');
  try {
    let items = null, engine = '';
    // Preferred: server-side function when deployed on Netlify (supports keyed providers).
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfqText, catalog: SAMPLE_CATALOG })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) { items = data.items; engine = data.engine || 'server-function'; }
      }
    } catch (_) { /* static host - fall through to direct provider call */ }
    if (!items) {
      // Static-host path: call the free open-model API directly from the browser.
      // No key is required or embedded; the UI discloses this third-party processing.
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You reply with strict valid JSON only.' },
            { role: 'user', content: buildPrompt(rfqText) }
          ],
          jsonMode: true
        })
      });
      if (!res.ok) throw new Error('AI provider returned HTTP ' + res.status);
      const raw = await res.text();
      const start = raw.indexOf('{'), end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error('AI returned no JSON');
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!Array.isArray(parsed.items)) throw new Error('AI returned no items');
      items = parsed.items; engine = 'pollinations-open-llm';
    }
    state.items = items.map(it => {
      const nz = normalizeSku(it.matched_sku);
      const flags = Array.isArray(it.flags) ? it.flags.map(String) : [];
      if (nz.snapped) { flags.push('match adjusted to nearest catalog SKU'); }
      if (it.matched_sku && !nz.sku) { flags.push('suggested match not in catalog'); }
      let conf = it.match_confidence || 'none';
      if (!nz.sku) conf = 'none';
      else if (nz.snapped && conf === 'high') conf = 'medium';
      return {
        raw_text: it.raw_text || '',
        item_name: it.item_name || '',
        quantity: it.quantity,
        unit: it.unit || '',
        specs: it.specs || '',
        matched_sku: nz.sku,
        match_confidence: conf,
        flags
      };
    });
    if (!state.items.length) throw new Error('No line items found in the enquiry.');
    renderItems();
    $('#step-review').classList.remove('hidden');
    $('#step-review').scrollIntoView({ behavior: 'smooth' });
    setStatus('Extraction complete (' + engine + '). Review every line before building the quote.');
  } catch (e) {
    setStatus('Extraction failed: ' + e.message + ' You can retry, or add lines manually below.', true);
    $('#step-review').classList.remove('hidden');
    renderItems();
  } finally {
    btn.disabled = false; btn.textContent = 'Extract with AI';
  }
}

function needsAttention(it) {
  return it.match_confidence !== 'high' || it.quantity == null || it.flags.length > 0;
}

function renderItems() {
  if (!state.items.length) {
    $('#items-table').innerHTML = '<p class="muted">No lines yet. Use "Add line manually" to build the quote by hand.</p>';
    return;
  }
  const options = ['<option value="">-- no match --</option>'].concat(
    SAMPLE_CATALOG.map(c => `<option value="${c.sku}">${c.sku} - ${c.name} (${c.spec})</option>`)
  ).join('');
  const rows = state.items.map((it, i) => {
    const attn = needsAttention(it);
    const flags = [];
    if (it.quantity == null) flags.push('<span class="flagchip">missing quantity</span>');
    if (it.match_confidence === 'none' || !it.matched_sku) flags.push('<span class="flagchip">no catalog match</span>');
    else if (it.match_confidence !== 'high') flags.push(`<span class="flagchip">${it.match_confidence} confidence</span>`);
    it.flags.forEach(f => {
      const norm = String(f).replace(/_/g, ' ').toLowerCase();
      if (norm === 'missing quantity' && it.quantity == null) return;
      flags.push(`<span class="flagchip">${norm.replace(/[<>]/g, '')}</span>`);
    });
    if (!flags.length) flags.push('<span class="flagchip ok">ok</span>');
    const sel = `<select data-i="${i}" class="match-sel">${options}</select>`;
    return `<tr class="${attn ? 'needs-attention' : ''}">
      <td><input data-i="${i}" class="f-name" value="${escapeAttr(it.item_name)}" placeholder="Item name"></td>
      <td><input data-i="${i}" class="f-specs" value="${escapeAttr(it.specs)}" placeholder="Specs"></td>
      <td><input data-i="${i}" class="f-qty qty" type="number" min="0" step="any" value="${it.quantity == null ? '' : it.quantity}" placeholder="?"></td>
      <td><input data-i="${i}" class="f-unit" value="${escapeAttr(it.unit)}" placeholder="unit"></td>
      <td>${sel}</td>
      <td>${flags.join('')}</td>
    </tr>`;
  }).join('');
  $('#items-table').innerHTML = `<table><thead><tr><th>Item</th><th>Specs</th><th>Qty</th><th>Unit</th><th>Catalog match</th><th>Flags</th></tr></thead><tbody>${rows}</tbody></table>`;
  state.items.forEach((it, i) => {
    const sel = document.querySelector(`select.match-sel[data-i="${i}"]`);
    if (sel) sel.value = it.matched_sku || '';
  });
  document.querySelectorAll('#items-table input, #items-table select').forEach(el => {
    el.addEventListener('change', syncItemFromInputs);
  });
}

function syncItemFromInputs() {
  document.querySelectorAll('#items-table tbody tr').forEach((tr, i) => {
    const g = (cls) => tr.querySelector(cls)?.value ?? '';
    state.items[i].item_name = g('.f-name');
    state.items[i].specs = g('.f-specs');
    const q = g('.f-qty');
    state.items[i].quantity = q === '' ? null : Number(q);
    state.items[i].unit = g('.f-unit');
    state.items[i].matched_sku = g('.match-sel');
    const cat = SAMPLE_CATALOG.find(c => c.sku === state.items[i].matched_sku);
    state.items[i].match_confidence = cat ? (state.items[i].match_confidence === 'none' ? 'medium' : state.items[i].match_confidence) : 'none';
  });
}


function normalizeSku(raw) {
  if (!raw) return { sku: '', snapped: false };
  const r = String(raw).trim().toUpperCase();
  if (SAMPLE_CATALOG.some(c => c.sku === r)) return { sku: r, snapped: false };
  const cand = SAMPLE_CATALOG.find(c => c.sku.toUpperCase().startsWith(r)) ||
               SAMPLE_CATALOG.find(c => r.startsWith(c.sku.toUpperCase())) ||
               SAMPLE_CATALOG.find(c => c.sku.toUpperCase().includes(r) || r.includes(c.sku.toUpperCase()));
  return cand ? { sku: cand.sku, snapped: true } : { sku: '', snapped: false };
}

function escapeAttr(s) { return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function buildQuote() {
  syncItemFromInputs();
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  $('#quote-meta').innerHTML = `
    <label>Customer name <input id="q-customer" placeholder="e.g. Demo Customer"></label>
    <label>Quote ref <input id="q-ref" value="QP-${Date.now().toString().slice(-6)}"></label>
    <span>Date: ${today}</span>`;
  renderQuote();
  $('#step-quote').classList.remove('hidden');
  $('#step-quote').scrollIntoView({ behavior: 'smooth' });
}

function quoteLines() {
  return state.items.map(it => {
    const cat = SAMPLE_CATALOG.find(c => c.sku === it.matched_sku);
    const qty = it.quantity;
    const unitPrice = cat ? cat.price : null;
    const stockIssue = cat && qty != null && qty > cat.stock;
    return { it, cat, qty, unitPrice, stockIssue, lineTotal: (unitPrice != null && qty != null) ? unitPrice * qty : null };
  });
}

function renderQuote() {
  const lines = quoteLines();
  const rows = lines.map(({ it, cat, qty, unitPrice, stockIssue, lineTotal }) => `<tr>
    <td>${escapeHtml(it.item_name)}${it.specs ? '<br><small>' + escapeHtml(it.specs) + '</small>' : ''}</td>
    <td>${cat ? cat.sku : '-'}</td>
    <td>${qty == null ? 'TBC' : qty} ${escapeHtml(it.unit || '')}</td>
    <td>${unitPrice == null ? 'TBC' : 'Rs ' + unitPrice.toLocaleString('en-IN')}</td>
    <td>${lineTotal == null ? 'TBC' : 'Rs ' + lineTotal.toLocaleString('en-IN')}${stockIssue ? ' <span class="flagchip">exceeds stock</span>' : ''}</td>
  </tr>`).join('');
  const total = lines.reduce((s, l) => s + (l.lineTotal || 0), 0);
  const anyTbc = lines.some(l => l.lineTotal == null);
  $('#quote-preview').innerHTML = `<div class="quote-box">
    <span class="draft">Draft - requires human approval</span>
    <h3>Quotation</h3>
    <table><thead><tr><th>Item</th><th>SKU</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="totals">Total${anyTbc ? ' (partial - some lines TBC)' : ''}: Rs ${total.toLocaleString('en-IN')}</p>
  </div>`;
  const open = [];
  lines.forEach(({ it, qty, unitPrice, stockIssue }) => {
    if (qty == null) open.push(`"${it.item_name}" has no quantity.`);
    if (unitPrice == null) open.push(`"${it.item_name}" has no catalog match, so it is unpriced.`);
    if (stockIssue) open.push(`"${it.item_name}" quantity exceeds sample stock.`);
    it.flags.forEach(f => open.push(`"${it.item_name}": ${f}`));
  });
  $('#quote-flags').innerHTML = open.length
    ? `<p class="disclosure"><strong>Open flags to resolve before sending:</strong><br>${open.map(escapeHtml).join('<br>')}</p>`
    : '<p class="disclosure" style="color:var(--ok);background:#d1fae5;border-color:#6ee7b7">All lines resolved. The rep should still sanity-check prices and availability.</p>';
}

function downloadPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const customer = $('#q-customer')?.value || 'Demo Customer';
  const ref = $('#q-ref')?.value || 'QP-DRAFT';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  let y = 18;
  doc.setFontSize(16); doc.text('QuotePilot - Draft Quotation', 14, y); y += 7;
  doc.setFontSize(10); doc.setTextColor(180, 83, 9);
  doc.text('DRAFT - requires human approval before sending to a customer', 14, y); y += 7;
  doc.setTextColor(0, 0, 0);
  doc.text(`Customer: ${customer}    Ref: ${ref}    Date: ${today}`, 14, y); y += 8;
  doc.setFontSize(9); doc.text('Prepared from an AI-extracted enquiry against a synthetic demo catalog. Verify prices, stock and specs.', 14, y); y += 8;
  const head = [['Item', 'SKU', 'Qty', 'Unit price', 'Amount']];
  const lines = quoteLines();
  const body = lines.map(({ it, cat, qty, unitPrice, lineTotal }) => [
    (it.item_name || '') + (it.specs ? '\n' + it.specs : ''),
    cat ? cat.sku : '-',
    (qty == null ? 'TBC' : String(qty)) + (it.unit ? ' ' + it.unit : ''),
    unitPrice == null ? 'TBC' : 'Rs ' + unitPrice.toLocaleString('en-IN'),
    lineTotal == null ? 'TBC' : 'Rs ' + lineTotal.toLocaleString('en-IN')
  ]);
  doc.autoTable ? doc.autoTable({ startY: y, head, body, styles: { fontSize: 8 }, headStyles: { fillColor: [22, 33, 46] } })
    : fallbackTable(doc, head, body, y);
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 60;
  const total = lines.reduce((s, l) => s + (l.lineTotal || 0), 0);
  const anyTbc = lines.some(l => l.lineTotal == null);
  doc.setFontSize(11);
  doc.text(`Total${anyTbc ? ' (partial - some lines TBC)' : ''}: Rs ${total.toLocaleString('en-IN')}`, 14, finalY);
  doc.save(`${ref}-quote-draft.pdf`);
}

function fallbackTable(doc, head, body, y) {
  doc.setFontSize(8);
  head[0] && doc.text(head[0].join(' | '), 14, y);
  body.forEach((r, i) => doc.text(r.join(' | ').slice(0, 110), 14, y + 6 * (i + 1)));
}

$('#btn-sample').addEventListener('click', () => { $('#rfq-input').value = SAMPLE_RFQ; setStatus(''); });
$('#btn-extract').addEventListener('click', extract);
$('#btn-add-item').addEventListener('click', () => {
  state.items.push({ raw_text: '', item_name: '', quantity: null, unit: '', specs: '', matched_sku: '', match_confidence: 'none', flags: ['added manually'] });
  renderItems();
});
$('#btn-build-quote').addEventListener('click', buildQuote);
$('#btn-back').addEventListener('click', () => { $('#step-quote').classList.add('hidden'); $('#step-review').scrollIntoView({ behavior: 'smooth' }); });
$('#btn-download').addEventListener('click', downloadPdf);

renderCatalog();
