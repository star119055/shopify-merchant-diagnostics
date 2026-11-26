const SAMPLES = {
  valid: `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>RE-2026-000104</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20261126</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>991-12345-67</ram:BuyerReference>
      <ram:SellerTradeParty>
        <ram:Name>Muster Shop GmbH</ram:Name>
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">DE123456789</ram:ID></ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>Kunde B2B AG</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>19.00</ram:CalculatedAmount>
        <ram:BasisAmount>100.00</ram:BasisAmount>
        <ram:RateApplicablePercent>19.00</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">19.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>119.00</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`,
  credit_missing: `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>ST-2026-000018</ram:ID>
    <ram:TypeCode>381</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20261126</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Muster Shop GmbH</ram:Name>
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">DE123456789</ram:ID></ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>Kunde B2B AG</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>50.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">3.50</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>53.50</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`,
  math_error: `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>RE-2026-000105</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">20261126</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>Muster Shop GmbH</ram:Name></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>Kunde B2B AG</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>100.00</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">19.00</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>120.00</ram:GrandTotalAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`
};

function findByLocalName(root, localName) {
  const all = root.getElementsByTagName("*");
  for (const el of all) {
    if (el.localName === localName) return el;
  }
  return null;
}

function textByLocalName(root, localName) {
  const el = findByLocalName(root, localName);
  return el ? el.textContent.trim() : "";
}

function inspectXml(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const parseErr = doc.getElementsByTagName("parsererror")[0];
  if (parseErr) {
    throw new Error("Ungültiges XML: " + parseErr.textContent.slice(0, 140));
  }

  const root = doc.documentElement;
  const syntax = root.localName === "CrossIndustryInvoice"
    ? "CII (ZUGFeRD / Factur-X)"
    : (root.localName === "Invoice" || root.localName === "CreditNote")
      ? "UBL (XRechnung)"
      : `Unbekannt (${root.localName})`;

  const isCii = root.localName === "CrossIndustryInvoice";
  const checks = [];

  const profile = isCii
    ? textByLocalName(findByLocalName(doc, "GuidelineSpecifiedDocumentContextParameter") || doc, "ID")
    : textByLocalName(doc, "CustomizationID");
  checks.push({
    name: "EN 16931 / Profil-Kennung (BT-24)",
    status: profile.includes("en16931") ? "ok" : profile ? "warn" : "fail",
    value: profile || "Fehlt"
  });

  const docEl = isCii ? (findByLocalName(doc, "ExchangedDocument") || doc) : root;
  const invId = textByLocalName(docEl, "ID");
  checks.push({
    name: "Rechnungsnummer (BT-1)",
    status: invId ? "ok" : "fail",
    value: invId || "Fehlt"
  });

  const issueDate = isCii ? textByLocalName(docEl, "DateTimeString") : textByLocalName(docEl, "IssueDate");
  checks.push({
    name: "Ausstellungsdatum (BT-2)",
    status: issueDate ? "ok" : "fail",
    value: issueDate || "Fehlt"
  });

  const typeCode = isCii
    ? textByLocalName(docEl, "TypeCode")
    : (textByLocalName(docEl, "InvoiceTypeCode") || textByLocalName(docEl, "CreditNoteTypeCode"));
  checks.push({
    name: "Dokumenttyp (BT-3: 380 / 381)",
    status: ["380", "381", "384", "389"].includes(typeCode) ? "ok" : "fail",
    value: typeCode || "Fehlt"
  });

  const currency = isCii ? textByLocalName(doc, "InvoiceCurrencyCode") : textByLocalName(doc, "DocumentCurrencyCode");
  checks.push({
    name: "Währung (BT-5)",
    status: /^[A-Z]{3}$/.test(currency) ? "ok" : "fail",
    value: currency || "Fehlt"
  });

  const sellerParty = isCii ? findByLocalName(doc, "SellerTradeParty") : findByLocalName(doc, "AccountingSupplierParty");
  const sellerName = sellerParty ? textByLocalName(sellerParty, "Name") : "";
  const sellerTax = sellerParty ? (textByLocalName(sellerParty, "ID") || textByLocalName(sellerParty, "CompanyID")) : "";
  checks.push({
    name: "Verkäufer & USt-IdNr./St.-Nr. (BG-4)",
    status: sellerName && sellerTax ? "ok" : sellerName ? "warn" : "fail",
    value: sellerName ? `${sellerName} (${sellerTax || "Steuernummer/USt-IdNr. fehlt"})` : "Fehlt"
  });

  const buyerParty = isCii ? findByLocalName(doc, "BuyerTradeParty") : findByLocalName(doc, "AccountingCustomerParty");
  const buyerName = buyerParty ? textByLocalName(buyerParty, "Name") : "";
  checks.push({
    name: "Käufername (BG-7)",
    status: buyerName ? "ok" : "fail",
    value: buyerName || "Fehlt"
  });

  const netStr = isCii ? textByLocalName(doc, "TaxBasisTotalAmount") : textByLocalName(doc, "TaxExclusiveAmount");
  const taxStr = isCii ? textByLocalName(doc, "TaxTotalAmount") : textByLocalName(doc, "TaxAmount");
  const grossStr = isCii ? textByLocalName(doc, "GrandTotalAmount") : textByLocalName(doc, "TaxInclusiveAmount");
  const net = Number.parseFloat(netStr);
  const tax = Number.parseFloat(taxStr);
  const gross = Number.parseFloat(grossStr);
  const mathOk = Number.isFinite(net) && Number.isFinite(tax) && Number.isFinite(gross) && Math.abs((net + tax) - gross) < 0.015;
  checks.push({
    name: "Summenprüfung Netto + MwSt. = Brutto",
    status: mathOk ? "ok" : "fail",
    value: Number.isFinite(gross) ? `${netStr} + ${taxStr} = ${grossStr} ${currency}` : "Summenfelder fehlen"
  });

  if (typeCode === "381") {
    const refEl = isCii ? findByLocalName(doc, "InvoiceReferencedDocument") : findByLocalName(doc, "BillingReference");
    const refId = refEl ? (textByLocalName(refEl, "IssuerAssignedID") || textByLocalName(refEl, "ID")) : "";
    checks.push({
      name: "Storno-Referenz auf Originalrechnung (BT-25)",
      status: refId ? "ok" : "fail",
      value: refId || "Fehlt – für GoBD & DATEV bei Storno (381) zwingend empfohlen"
    });
  }

  return { syntax, checks };
}

const form = document.getElementById("xml-form");
const input = document.getElementById("xml-input");
const fileInput = document.getElementById("xml-file");
const sampleSelect = document.getElementById("sample");
const loadBtn = document.getElementById("load-sample");
const parseError = document.getElementById("parse-error");
const empty = document.getElementById("empty");
const report = document.getElementById("report");
const summaryBox = document.getElementById("summary-box");
const checkRows = document.getElementById("check-rows");

function runCheck() {
  parseError.hidden = true;
  const raw = input.value.trim();
  if (!raw) {
    parseError.textContent = "Bitte fügen Sie eine XML-Datei ein oder laden Sie ein Beispiel.";
    parseError.hidden = false;
    return;
  }
  try {
    const { syntax, checks } = inspectXml(raw);
    const fails = checks.filter((c) => c.status === "fail").length;
    const warns = checks.filter((c) => c.status === "warn").length;
    summaryBox.dataset.status = fails === 0 ? "pass" : "fail";
    summaryBox.innerHTML = fails === 0
      ? `<strong>Basis-Check bestanden (${syntax})</strong><br>${warns ? `${warns} Hinweis(e) prüfen.` : "Alle geprüften Pflichtfelder und Summen sind konsistent."}`
      : `<strong>${fails} kritische Abweichung(en) gefunden (${syntax})</strong><br>Beheben Sie die markierten Felder vor Versand an B2B-Kunden oder DATEV-Import.`;
    checkRows.innerHTML = "";
    for (const c of checks) {
      const tr = document.createElement("tr");
      const badgeClass = c.status === "ok" ? "badge-ok" : c.status === "warn" ? "badge-warn" : "badge-fail";
      const label = c.status === "ok" ? "OK" : c.status === "warn" ? "Hinweis" : "Fehler";
      tr.innerHTML = `<td>${c.name}</td><td class="${badgeClass}">${label}</td><td></td>`;
      tr.lastElementChild.textContent = c.value;
      checkRows.appendChild(tr);
    }
    empty.hidden = true;
    report.hidden = false;
  } catch (err) {
    parseError.textContent = err.message;
    parseError.hidden = false;
  }
}

loadBtn.addEventListener("click", () => {
  input.value = SAMPLES[sampleSelect.value] || SAMPLES.valid;
  runCheck();
});

fileInput.addEventListener("change", async () => {
  const f = fileInput.files?.[0];
  if (!f) return;
  input.value = await f.text();
  runCheck();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  runCheck();
});

form.addEventListener("reset", () => {
  empty.hidden = false;
  report.hidden = true;
  parseError.hidden = true;
});
