import { assessMissingCapture, comparePurchase } from './diagnostic.mjs';

const purchase = { name: 'purchase', params: { transaction_id: 'DEMO-1001', value: 45, currency: 'USD', items: [{ item_id: 'demo-mug', price: 45, quantity: 1 }] } };
const ga4 = { platform: 'ga4', orderId: 'DEMO-1001', value: '45.00', currency: 'USD', destination: '', scopeConfirmed: true, usesSameValueBasis: true };
const wrongCurrency = { ...purchase, params: { ...purchase.params, currency: 'CAD' } };
const samples = {
  ga4: { ...ga4, payload: { events: [purchase] } },
  repeat: { ...ga4, payload: [wrongCurrency, wrongCurrency] },
  ads: {
    ...ga4, platform: 'google_ads', destination: 'AW-123456/purchase-main',
    payload: { send_to: 'AW-123456/purchase-test', transaction_id: 'DEMO-1001', value: 45, currency: 'USD' },
  },
  basis: { ...ga4, value: '55.00', usesSameValueBasis: false, payload: purchase },
};

const form = document.querySelector('#evidence');
const captureCheck = document.querySelector('#capture-check');
const platform = document.querySelector('#platform');
const destination = document.querySelector('#destination');
const report = document.querySelector('#report');
const reportHeading = document.querySelector('#report-heading');
const empty = document.querySelector('#empty');
const error = document.querySelector('#error');
const exampleState = document.querySelector('#example-state');
const sample = document.querySelector('#sample');
const scopeFields = new Set(['platform', 'destination', 'orderId', 'eventsText']);
let exampleName = '';
let edited = false;
let currentReport = '';

function el(tag, content) {
  const node = document.createElement(tag);
  node.textContent = content;
  return node;
}

function updatePlatform() {
  const ads = platform.value === 'google_ads';
  document.querySelector('#destination-field').hidden = !ads;
  destination.required = ads;
  destination.disabled = !ads;
  document.querySelector('#basis-help').textContent = ads
    ? 'Use the exact ID, value and currency you intended this Google Ads conversion action to receive.'
    : 'For GA4 purchase revenue, use item price × quantity after applicable item discounts, excluding tax and shipping.';
  document.querySelector('#events').placeholder = ads
    ? 'Paste the Google tag conversion parameters as JSON'
    : 'Paste a purchase event object or an events envelope as JSON';
}

function clearReport() {
  currentReport = '';
  delete report.dataset.mode;
  reportHeading.textContent = 'Comparison report';
  report.hidden = true;
  empty.hidden = false;
  error.hidden = true;
}

function reveal(target) {
  target.scrollIntoView({ block: 'start' });
  target.focus({ preventScroll: true });
}

function provenance() {
  if (!exampleName) return 'Manually entered evidence';
  return `Synthetic example: ${exampleName}${edited ? ' (edited)' : ''}`;
}

function updateExampleState() {
  exampleState.hidden = !exampleName;
  exampleState.textContent = exampleName ? `${provenance()}. Clear the form before checking a real case.` : '';
}

function render(result, mode = 'comparison') {
  const evidenceLabel = mode === 'capture' ? 'Self-reported test status · No captured payload' : provenance();
  report.dataset.mode = mode;
  reportHeading.textContent = mode === 'capture' ? 'Capture triage report' : 'Comparison report';
  document.querySelector('#report-provenance').textContent = evidenceLabel;
  const heading = document.querySelector('#status');
  heading.dataset.state = result.status;
  heading.replaceChildren(el('h3', result.title), el('p', result.summary));
  document.querySelector('#rows').replaceChildren(...result.rows.map((row) => {
    const tr = document.createElement('tr');
    const field = el('th', row.field);
    field.scope = 'row';
    const observed = document.createElement('td');
    observed.dataset.state = row.status;
    observed.append(el('strong', row.observed));
    if (row.detail) observed.append(el('small', row.detail));
    tr.append(field, el('td', row.expected), observed);
    return tr;
  }));
  document.querySelector('#notes').replaceChildren(...result.notes.map((note) => el('li', note)));
  currentReport = [
    'SHOPIFY PURCHASE EVENT CHECK', evidenceLabel, result.title, result.summary, '',
    ...result.rows.flatMap((row) => [`${row.field}: expected ${row.expected}; observed ${row.observed}`, ...(row.detail ? [`  ${row.detail}`] : [])]),
    '', ...result.notes, '',
  ].join('\n');
  report.hidden = false;
  empty.hidden = true;
}

function compare() {
  clearReport();
  try {
    const data = Object.fromEntries(new FormData(form));
    render(comparePurchase({ ...data, scopeConfirmed: data.scopeConfirmed === 'on', usesSameValueBasis: data.usesSameValueBasis === 'on' }));
    reveal(reportHeading);
  } catch (reason) {
    error.textContent = reason.message;
    error.hidden = false;
    reveal(error);
  }
}

platform.addEventListener('change', updatePlatform);
form.addEventListener('input', ({ target }) => {
  edited = true;
  const scopeChanged = scopeFields.has(target.name);
  if (scopeChanged) form.elements.scopeConfirmed.checked = false;
  if (scopeChanged || target.name === 'value' || target.name === 'currency') {
    form.elements.usesSameValueBasis.checked = false;
  }
  clearReport();
  updateExampleState();
});
form.addEventListener('reset', () => {
  exampleName = '';
  edited = false;
  clearReport();
  updateExampleState();
  queueMicrotask(updatePlatform);
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  compare();
});
captureCheck.addEventListener('change', () => {
  if (report.dataset.mode === 'capture') clearReport();
});
captureCheck.addEventListener('submit', (event) => {
  event.preventDefault();
  clearReport();
  render(assessMissingCapture(Object.fromEntries(new FormData(captureCheck))), 'capture');
  reveal(reportHeading);
});

document.querySelector('#load').addEventListener('click', () => {
  if (edited && !window.confirm('Replace the current evidence with this synthetic example?')) return;
  exampleName = sample.selectedOptions[0].textContent;
  edited = false;
  const { payload, ...values } = samples[sample.value];
  for (const [name, value] of Object.entries(values)) {
    const field = form.elements.namedItem(name);
    if (typeof value === 'boolean') field.checked = value;
    else field.value = value;
  }
  document.querySelector('#events').value = JSON.stringify(payload, null, 2);
  updatePlatform();
  updateExampleState();
  compare();
});

for (const button of document.querySelectorAll('.copy-template')) {
  button.addEventListener('click', async () => {
    const template = document.getElementById(button.dataset.template);
    const feedback = document.querySelector('#template-feedback');
    try {
      await navigator.clipboard.writeText(template.textContent);
      feedback.textContent = 'Template copied. Replace all example values with the observed fields.';
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(template);
      selection.removeAllRanges();
      selection.addRange(range);
      feedback.textContent = 'Template selected. Copy the text using your browser.';
    }
    feedback.hidden = false;
  });
}

document.querySelector('#download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([currentReport], { type: 'text/plain;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'shopify-purchase-event-report.txt' });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
});

updatePlatform();
