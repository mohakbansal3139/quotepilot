# QuotePilot

AI-assisted quote drafting for industrial-supplies distributors. Course project for AI in Business (DTP7203), Masters Union.

## What it does

1. A sales rep pastes a customer enquiry (RFQ) as plain text.
2. A real LLM extracts line items, quantities and specifications, flags ambiguity, and proposes matches against a catalog.
3. The rep reviews and edits every line - quantities, specs and matches. Unmatched items are never priced automatically.
4. The rep downloads an approval-ready draft quote PDF. Nothing is ever sent to a customer by the app.

## Demo status and honesty notes

- This is a working prototype with a **synthetic sample catalog** (fictional SKUs, prices and stock in `public/catalog.js`). A production deployment would match against the distributor's own catalog, stock and price data.
- AI extraction runs server-side in `netlify/functions/extract.js`. By default it calls the free Pollinations.ai API (open models, no key). Setting a `GEMINI_API_KEY` environment variable switches it to Gemini 2.0 Flash instead. No keys are stored in this repo or in client code.
- Because pasted text goes to a third-party AI provider, the UI tells users not to paste real or confidential customer requests in this demo.
- PDF/photo/voice-note intake and real customer-data pilots are future scope from the project proposal, not implemented here.

## Core task to test

Paste the sample enquiry ("Load sample enquiry"), click "Extract with AI", review the flagged lines, then download the quote PDF. Expected result: extracted editable line items with catalog matches and ambiguity flags, and a downloadable draft quotation PDF.

## Stack

Static frontend (`public/`) + one Netlify serverless function (`netlify/functions/extract.js`). No build step. Quote PDF generated client-side with jsPDF.

## Local development

Any static server for `public/` plus `netlify dev` for the function, or deploy to Netlify directly.
