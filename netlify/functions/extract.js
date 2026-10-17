// QuotePilot AI extraction endpoint.
// Calls a real LLM (Pollinations.ai open models, no key required) server-side.
// Optionally uses GEMINI_API_KEY env var if configured.
const CATALOG_HINT = `You are an RFQ extraction engine for an Indian industrial-supplies distributor.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST only' }) };
  }
  let payload;
  try { payload = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }
  const rfqText = (payload.rfqText || '').slice(0, 8000);
  const catalog = Array.isArray(payload.catalog) ? payload.catalog.slice(0, 200) : [];
  if (!rfqText.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'rfqText is required' }) };
  }

  const catalogLines = catalog.map(c =>
    `${c.sku} | ${c.name} | ${c.spec} | unit:${c.unit} | price:${c.price} | stock:${c.stock}`
  ).join('\n');

  const prompt = `${CATALOG_HINT}
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
${rfqText}`;

  try {
    let raw;
    if (process.env.GEMINI_API_KEY) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
      });
      const j = await r.json();
      raw = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      const r = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You reply with strict valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          jsonMode: true
        })
      });
      raw = await r.text();
    }
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('no JSON in model output');
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(parsed.items)) throw new Error('items missing');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: parsed.items, engine: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'pollinations-open-llm' })
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'AI extraction failed: ' + e.message }) };
  }
};
