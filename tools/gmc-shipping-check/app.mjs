import { diagnose } from './diagnostic.mjs';

const common = {
  offer: 'demo-001', country: 'US', source: 'Google & YouTube',
  region: 'ZIP 10001, standard, 1 item', observedAt: '2026-11-22T10:00',
  productAmount: '50.00', productCurrency: 'USD',
  shippingAmount: '8.00', shippingCurrency: 'AUD', shippingScope: 'same', shippingSource: 'offer',
  checkoutAmount: '8.00', checkoutCurrency: 'USD', checkoutScope: 'same', currentStatus: 'Limited',
};
const samples = {
  mismatch: common,
  zero: { ...common, shippingAmount: '0', shippingCurrency: 'USD', checkoutAmount: '0.00', currentStatus: 'Approved' },
  country: { ...common, shippingScope: 'different', shippingSource: 'account' },
  sync: {
    ...common, shippingCurrency: 'USD', currentStatus: 'Approved',
    previousOffer: common.offer, previousCountry: common.country, previousSource: 'Legacy feed',
    previousRegion: common.region, previousObservedAt: '2026-11-21T10:00', previousStatus: 'Limited',
  },
};

const form = document.querySelector('#evidence');
const result = document.querySelector('#report');
const feedback = document.querySelector('#feedback');
const editEvidence = document.querySelector('#edit-evidence');
const scopeFeedback = document.querySelector('#scope-feedback');
const samplePicker = document.querySelector('#sample');
const sharedEvidence = new Set(['offer', 'country', 'source', 'region', 'productAmount', 'productCurrency']);
const shippingEvidence = new Set(['shippingAmount', 'shippingCurrency', 'shippingSource']);
const checkoutEvidence = new Set(['checkoutAmount', 'checkoutCurrency']);
let currentReport = '';
let sampleName = '';
let edited = false;

function element(tag, content) {
  const node = document.createElement(tag);
  node.textContent = content;
  return node;
}

function clean(value) {
  return String(value ?? '').trim() || 'Not recorded';
}

function reportText(input, findings) {
  const list = (items) => items.map((item) => `- ${item}`);
  return [
    'MERCHANT CENTER SHIPPING CURRENCY CHECK',
    ...(sampleName ? [`Started from synthetic example — ${sampleName}${edited ? ' (manually edited)' : ''}`] : []),
    `Offer: ${clean(input.offer)}`,
    `Target country: ${clean(input.country).toUpperCase()}`,
    `Data source: ${clean(input.source)}`,
    `Delivery conditions: ${clean(input.region)}`,
    `Current observation (local time): ${clean(input.observedAt)}`,
    `Current status: ${clean(input.currentStatus)}`,
    '', findings.title, findings.summary, '', 'EVIDENCE',
    ...findings.rows.flatMap(({ label, value, detail }) => [`${label}: ${value}`, ...(detail ? [`  ${detail}`] : [])]),
    ...(findings.gaps.length ? ['', 'EVIDENCE TO CONFIRM', ...list(findings.gaps)] : []),
    '', 'STATUS HISTORY', findings.sync.title, findings.sync.detail,
    '', 'NEXT CHECKS', ...list(findings.steps), '',
    'Check Merchant Center for current product eligibility.',
    'Google currency requirements: https://support.google.com/merchants/answer/15075344?hl=en',
    'Google shipping attribute: https://support.google.com/merchants/answer/6324484?hl=en',
    '',
  ].join('\n');
}

function render(input, findings) {
  const outcome = document.querySelector('#outcome');
  outcome.dataset.status = findings.outcome;
  outcome.replaceChildren(element('h3', findings.title), element('p', findings.summary));

  document.querySelector('#comparison').replaceChildren(...findings.rows.map(({ label, value, detail, status }) => {
    const group = document.createElement('div');
    const description = element('dd', value);
    description.dataset.status = status;
    if (detail) description.append(element('p', detail));
    group.append(element('dt', label), description);
    return group;
  }));

  document.querySelector('#gap-section').hidden = findings.gaps.length === 0;
  document.querySelector('#gaps').replaceChildren(...findings.gaps.map((gap) => element('li', gap)));
  document.querySelector('#steps').replaceChildren(...findings.steps.map((step) => element('li', step)));
  document.querySelector('#sync').replaceChildren(element('strong', findings.sync.title), element('p', findings.sync.detail));
  const provenance = document.querySelector('#report-provenance');
  provenance.hidden = !sampleName;
  provenance.textContent = sampleName ? `Started from a synthetic example. ${sampleName}.` : '';
  currentReport = reportText(input, findings);
  feedback.hidden = true;
  editEvidence.hidden = false;
  document.querySelector('#empty').hidden = true;
  result.hidden = false;
}

function resetReport() {
  currentReport = '';
  result.hidden = true;
  feedback.hidden = true;
  editEvidence.hidden = true;
  document.querySelector('#empty').hidden = false;
}

function compare() {
  const input = Object.fromEntries(new FormData(form));
  if (!input.offer.trim()) {
    form.elements.namedItem('offer').reportValidity();
    return;
  }
  render(input, diagnose(input));
  document.querySelector('#result').scrollIntoView({ block: 'start' });
  document.querySelector('#result-heading').focus({ preventScroll: true });
}

function showFeedback(message) {
  feedback.replaceChildren(message);
  feedback.hidden = false;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  compare();
});

editEvidence.addEventListener('click', (event) => {
  event.preventDefault();
  form.scrollIntoView({ block: 'start' });
  form.elements.namedItem('offer').focus({ preventScroll: true });
});

form.addEventListener('input', (event) => {
  const { name, value } = event.target;
  edited = true;
  event.target.setCustomValidity?.(name === 'offer' && value && !value.trim() ? 'Enter an offer ID.' : '');
  const invalidate = [];
  if (sharedEvidence.has(name) || shippingEvidence.has(name)) invalidate.push(['shippingScope', 'Merchant Center rate']);
  if (sharedEvidence.has(name) || checkoutEvidence.has(name)) invalidate.push(['checkoutScope', 'checkout conditions']);
  const changed = invalidate.filter(([field]) => form.elements.namedItem(field).value !== 'unknown');
  for (const [field] of changed) form.elements.namedItem(field).value = 'unknown';
  if (changed.length) {
    scopeFeedback.textContent = `Evidence changed. Reconfirm the ${changed.map(([, label]) => label).join(' and ')}.`;
    scopeFeedback.hidden = false;
  } else if (name === 'shippingScope' || name === 'checkoutScope') {
    scopeFeedback.hidden = true;
  }
  if (currentReport) resetReport();
});

form.addEventListener('reset', () => {
  sampleName = '';
  edited = false;
  form.elements.namedItem('offer').setCustomValidity('');
  document.querySelector('#sample-notice').hidden = true;
  scopeFeedback.hidden = true;
  resetReport();
  document.querySelector('#previous').open = false;
});

document.querySelector('#load-sample').addEventListener('click', () => {
  if (edited && !window.confirm('Replace your edited evidence with a synthetic example?')) return;
  const sample = samples[samplePicker.value];
  form.reset();
  sampleName = samplePicker.selectedOptions[0].textContent;
  for (const [name, value] of Object.entries(sample)) form.elements.namedItem(name).value = value;
  const notice = document.querySelector('#sample-notice');
  notice.hidden = false;
  notice.textContent = `Synthetic example loaded. ${sampleName}. Clear the form to start a live case.`;
  document.querySelector('#previous').open = Boolean(sample.previousStatus);
  compare();
});

document.querySelector('#download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([currentReport], { type: 'text/plain;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'merchant-center-shipping-report.txt' });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
});

document.querySelector('#copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(currentReport);
    showFeedback('Report copied.');
  } catch {
    showFeedback('Clipboard is unavailable. Download the report to save a copy.');
  }
});
