SHIPPED SUBMISSION FIELDS (draft for review - not submitted)

Product name: QuotePilot
Live product URL: https://<custom-domain-pending> (GitHub Pages hosting; public repo)
GitHub repository: https://github.com/mohakbansal3139/quotepilot (public)

Core task to test:
"Load the sample enquiry, click 'Extract with AI', review the extracted lines, then download the quote PDF."
Expected result: the app extracts line items with quantities, specs and catalog matches from the enquiry text (ambiguous lines are flagged, e.g. missing quantity), lets the reviewer edit every line, and produces a draft quotation PDF with priced lines, a partial or full total, and open flags. No login is required. Use the built-in sample enquiry button; please do not paste real customer requests, as pasted text is processed by a third-party AI provider (Pollinations.ai) in this demo.

Working features:
- Paste or load a customer enquiry (plain text)
- Real AI extraction of items/quantities/specs with ambiguity flags (open LLM via Pollinations.ai free API, called from the browser; no key embedded)
- Catalog matching against a synthetic sample catalog with confidence levels; near-matches are flagged, unmatched items are never priced
- Human review table: edit item names, specs, quantities, units and catalog matches
- Quote draft preview with partial-total honesty (TBC lines) and open-flags list
- Downloadable draft quotation PDF (marked DRAFT - requires human approval)

Access instructions: no login required; open the URL and use the sample enquiry.

Known limits (honest): synthetic demo catalog (not a real distributor's data); PDF/photo/voice-note intake is future scope; free AI tier has no uptime guarantee; extraction can be wrong and the review step is the control.
