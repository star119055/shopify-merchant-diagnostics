# Shopify Merchant Diagnostic Tools (Browser-Local)

Free, zero-backend, browser-local diagnostic tools for Shopify merchants, PPC/Shopping teams, and German B2B stores. All case data stays in your browser tab — no store login or API keys required.

## Included Tools

### 1. Google Merchant Center Shipping Currency Mismatch Checker
- **Live Tool:** https://gmc-shipping-check.vercel.app/
- **Fix Guide:** https://gmc-shipping-check.vercel.app/guide
- **Fiverr Escrow Audit ($20 intro):** https://www.fiverr.com/star119055gmail/fix-shopify-google-merchant-center-shipping-currency-mismatch
- **Solves:** *"Mismatched currency in shipping information"* disapprovals on Shopify Markets / multi-currency stores. Compares offer-level vs. account-level Merchant Center shipping currency against live Shopify checkout conditions and generates a local evidence report.

### 2. Shopify GA4 & Google Ads Purchase Event Checker
- **Live Tool:** https://shopify-purchase-event-check.vercel.app/
- **Wrong Ads Action Guide:** https://shopify-purchase-event-check.vercel.app/guide
- **Checkout Migration Guide:** https://shopify-purchase-event-check.vercel.app/additional-scripts-deprecated
- **Fiverr Escrow Audit ($20 intro):** https://www.fiverr.com/star119055gmail/audit-and-fix-shopify-ga4-and-google-ads-purchase-tracking
- **Solves:** Missing, duplicated, or misrouted (`send_to` mismatch) Google Ads and GA4 `purchase` events after Shopify deprecated Thank You page Additional Scripts in favor of Customer Events / Custom Pixels (`checkout_completed`).

### 3. German Shopify E-Rechnung (ZUGFeRD / XRechnung EN 16931) XML Validator
- **Live Tool:** https://belegvio-erechnung-check.vercel.app/
- **2026 Compliance & DATEV EXTF Checklist:** https://belegvio-erechnung-check.vercel.app/checkliste-2026
- **Fiverr Escrow Audit ($20 intro):** https://www.fiverr.com/star119055gmail/audit-german-shopify-e-rechnung-zugferd-xrechnung-and-datev-extf
- **Solves:** Client-side EN 16931 check for CII (ZUGFeRD / Factur-X) and UBL (XRechnung) XML invoices — validates BT-1, BT-2, BT-3 (`380`/`381`), BT-5 currency, Seller VAT ID, net+tax=gross arithmetic, and TypeCode `381` credit note references (`InvoiceReferencedDocument` / BT-25) for German GoBD & DATEV EXTF workflows.
- **Automated Shopify App:** [Belegvio E-Rechnung](https://apps.shopify.com/belegvio-e-rechnung) (ZUGFeRD 2.3 PDF/XML + automated `381` refund credit notes + DATEV EXTF export).

---

## Need a Fixed-Scope Written Diagnostic?

If a live Shopify store or client account has persistent GMC shipping disapprovals, duplicate/missing Google Ads purchase conversions, or German E-Rechnung / DATEV EXTF errors:

- **Scope:** 1 affected offer / 1 test checkout / 1 invoice+credit-note pair
- **Turnaround:** 2 business days · **No store password required** (redacted screenshots or payloads only)
- **Deliverable:** Root-cause writer/config identification, exact single fix, rollback value, and post-sync verification checklist
- **Fixed Price:** US$49 via PayPal — links available directly on each tool page, or email redacted details to `wadeelric34@gmail.com`.

## Run Locally

Each tool in `tools/` is plain static HTML/CSS/ES modules with a strict `connect-src 'none'` Content-Security-Policy. Open with any local static server:

```bash
python3 -m http.server 8080 --directory tools/gmc-shipping-check
```

## License

MIT
