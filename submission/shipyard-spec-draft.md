SHIPYARD CHECKPOINT 2 SPEC (draft for Mohak's review - NOT submitted; not due tonight per current info)
Fields: JOB SPEC + FEATURE LIST (30,000 chars each) + up to 6 screen images (actual UI screenshots already captured).

JOB SPEC (draft):
When an industrial-supplies distributor's sales rep receives a messy customer enquiry (WhatsApp text, email, or pasted message), they use QuotePilot to turn it into an approval-ready quote draft in minutes instead of assembling it by hand.
The rep pastes the enquiry text as received. QuotePilot's AI extracts every requested line item with quantities, units and specifications, and flags anything ambiguous or missing (for example a stated item with no quantity, or a deadline mention). It proposes matches against the distributor's catalog with a confidence level, snapping near-matches to the closest catalog SKU and visibly flagging the adjustment rather than hiding it.
The rep then reviews every line in an editable table: fixing quantities, correcting specs, confirming or changing the catalog match. Unmatched items are never priced automatically - they stay marked "TBC" so no invented price can reach a customer. When the review is complete, the rep generates a draft quotation PDF marked "DRAFT - requires human approval", with priced lines, an honest partial total when lines are unresolved, and the list of open flags to resolve before sending.
The job is done when the rep has a complete, accurate draft they trust enough to send - with every AI suggestion either confirmed or corrected by a human.

FEATURE LIST (draft):
1. Enquiry intake: paste any customer enquiry as plain text; a synthetic sample enquiry is included for evaluation.
2. AI extraction: a real LLM (open models via the Pollinations.ai free API in this prototype) extracts line items, quantities, units and specifications as structured data, and flags ambiguity, missing values and deadline mentions. Pasted text is processed by the third-party provider; the UI tells users not to paste real or confidential requests in this demo.
3. Catalog matching: each extracted item is matched against the catalog with a high/medium/low/none confidence level. Near-matches snap to the nearest catalog SKU and are flagged as adjusted. Items with no reasonable match stay unmatched and unpriced.
4. Human review: an editable table for item names, specs, quantities, units and matches; every line needing attention is highlighted and flagged.
5. Quote draft: customer name, reference and date; priced lines from catalog list prices; stock check against sample stock with an "exceeds stock" flag; partial-total honesty when lines are unresolved; open-flags summary.
6. PDF download: one-click draft quotation PDF marked DRAFT - requires human approval, including the open-flags list.
7. Demo boundaries (explicit): synthetic sample catalog, not real distributor data; PDF/photo/voice-note intake is future scope; no emails or messages are ever sent to customers by the app; free AI tier has no uptime guarantee.

SCREEN IMAGES (captured from the actual working UI, available):
1. Enquiry intake with sample loaded (step 1)
2. Review table after AI extraction with flags (step 2)
3. Quote draft with partial total and open flags (step 3)
(+ the generated PDF itself as supporting evidence)
