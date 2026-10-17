SHIPPED SUBMISSION 1 - FINAL FIELDS (for Mohak's review before submit)

Form step 1 (https://shipped.money/app/submit):
- Product name: QuotePilot
- Live product URL: https://quotepilot.dhukaan.in
  (fallback only if domain fails: none - platform URL is rejected)

Form step 2 (after "Continue to submission"):
- GitHub repository: https://github.com/mohakbansal3139/quotepilot (public)
- GitHub key: fine-grained PAT, Contents + Metadata + Pull requests = Read-only,
  scoped to "Only select repositories: quotepilot" - pasted ONLY into the protected field on Shipped.

Core task to test (paste into form):
Load the sample enquiry, click "Extract with AI", review the extracted lines, then download the quote PDF.

Expected result (paste into form):
The app reads the enquiry text with a real AI model and produces editable line items with quantities, units and specs. Ambiguous lines are flagged (for example an item with no quantity). Each line is matched against a sample catalog with a confidence level; near-matches are visibly marked as adjusted and unmatched items are never priced. The reviewer can edit every line, then generate a draft quotation PDF marked "DRAFT - requires human approval" with priced lines, an honest partial total if lines are unresolved, and the list of open flags.

Access instructions (paste into form):
No login needed. Open the URL, click "Load sample enquiry", then "Extract with AI". Extraction takes about 20-30 seconds. Please use the built-in sample enquiry rather than pasting real customer requests: in this demo, pasted text is processed by a third-party AI provider (Pollinations.ai free tier). No real customer data anywhere in the app; the catalog is synthetic.

Checkbox: confirm, then "Submit working product".
