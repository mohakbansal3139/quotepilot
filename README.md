# QuotePilot

AI-assisted quote drafting for industrial-supplies distributors. Course project for AI in Business (DTP7203), Masters Union.

## What it does

1. A sales rep pastes a customer enquiry (RFQ) as plain text.
2. An AI model extracts line items, quantities and specifications, flags ambiguity, and proposes matches against a catalog.
3. The rep reviews and edits every line - quantities, specs and matches. Unmatched or unit-incompatible items are not priced automatically.
4. The rep acknowledges the review gate and downloads a draft quote PDF. Nothing is sent to a customer by the app.

## Demo status and honesty notes

- This is a working prototype with a **synthetic sample catalog** (fictional SKUs, prices and stock in `docs/catalog.js`). A production deployment should use the distributor's own catalog, stock and price data.
- The static page currently calls Pollinations directly and embeds no API key. The provider can reject unauthenticated or exhausted requests (HTTP 401/402); when that happens, extraction stops and the rep can add lines manually. A production deployment needs an approved browser OAuth flow or a server endpoint with its provider secret kept server-side.
- Because pasted text is sent to a third-party AI provider when extraction is available, the UI tells users not to paste real or confidential customer requests into this demo.
- PDF, photo and voice-note intake and real customer-data pilots are outside the current prototype.

## Core task to test

Paste the sample enquiry, click **Extract with AI**, review every line, build the quote, check the review acknowledgment, then download the PDF. Unmatched products stay unpriced, incompatible units are flagged with price withheld, and long RFQs are never silently clipped.

## Stack

Static frontend in `docs/`, no app build step. The live site at https://quotepilot.dhukaan.in is served by GitHub Pages from the `docs/` folder. Quote PDFs are generated client-side with jsPDF and AutoTable.

## Regression tests

The deterministic suite replays 25 synthetic RFQs through the extraction and normalization path using mocked model replies; it does not call Pollinations. It also checks JSON recovery, safe SKU matching, oversized-input handling, model-output escaping, PDF pagination and the review acknowledgment.

Run with Node.js:

```sh
node --test tests/stress-replay.test.mjs
```

## Local development

Serve `docs/` with any static HTTP server. GitHub Pages deploys the `docs/` folder.
