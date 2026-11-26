const maxBytes = 128 * 1024;
const maxRecords = 60;
const originalNumber = Symbol('originalNumber');
const adsDestinationPattern = /^AW-[0-9]{1,20}\/[A-Za-z0-9_-]{1,100}$/;

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function transactionId(value) {
  return typeof value === 'string' && value.trim() && value.length <= 256 && !/[\x00-\x1f\x7f]/.test(value) ? value : '';
}

function currencyCode(value) {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value) ? value : '';
}

function adsDestination(value) {
  return typeof value === 'string' && adsDestinationPattern.test(value) ? value : '';
}

function amount(value, allowExponent = false) {
  if (typeof value !== 'string' || value.length > 42) return '';
  const match = /^(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d{1,2}))?$/.exec(value);
  if (!match || (!allowExponent && match[3] !== undefined)) return '';
  const [, integer, fraction = '', exponent = '0'] = match;
  const offset = Number(exponent);
  if (Math.abs(offset) > 30) return '';
  const digits = integer + fraction;
  const point = integer.length + offset;
  const whole = (point <= 0 ? '0' : digits.slice(0, point).padEnd(point, '0')).replace(/^0+(?=\d)/, '');
  const decimals = (point < 0 ? '0'.repeat(-point) + digits : digits.slice(point)).replace(/0+$/, '');
  if (whole.length > 18 || decimals.length > 12) return '';
  return decimals ? `${whole}.${decimals}` : whole;
}

function observedAmount(value) {
  if (!record(value) || !Object.hasOwn(value, originalNumber)) return '';
  return amount(value[originalNumber], true);
}

function readCapture(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('Paste a purchase or conversion capture as JSON.');
  if (raw.length > maxBytes || new TextEncoder().encode(raw).length > maxBytes) {
    throw new Error('The capture must be at most 128 KB. Paste only the test events.');
  }
  try {
    return JSON.parse(raw, (key, value, context) => {
      if (key === 'value' && typeof value === 'number') return { [originalNumber]: context?.source };
      return value;
    });
  } catch {
    throw new Error('The capture is not valid JSON. Paste the existing event object or a JSON array.');
  }
}

function gtagTuple(value) {
  return Array.isArray(value) && value.length === 3 && value[0] === 'event' && typeof value[1] === 'string' && record(value[2]);
}

function classify(value) {
  if (gtagTuple(value)) {
    if (value[1] === 'conversion') return { platform: 'google_ads', params: value[2] };
    return null;
  }
  if (!record(value)) return null;
  if (typeof value.name === 'string' && !Object.hasOwn(value, 'send_to')) {
    return value.name === 'purchase' ? { platform: 'ga4', params: record(value.params) ? value.params : {} } : null;
  }
  if (Object.hasOwn(value, 'send_to') && !Object.hasOwn(value, 'name')) return { platform: 'google_ads', params: value };
  return null;
}

function eventRecords(capture) {
  if (!record(capture) && !Array.isArray(capture)) throw new Error('Paste one event object or a nonempty array of captured events.');
  const topLevel = Array.isArray(capture) && !gtagTuple(capture) ? capture : [capture];
  if (!topLevel.length) throw new Error('The event array is empty.');
  if (topLevel.length > maxRecords) throw new Error('Use up to 60 captured events per comparison.');
  const entries = [];
  for (const value of topLevel) {
    if (record(value) && Object.hasOwn(value, 'events')) {
      if (!Array.isArray(value.events) || !value.events.length) throw new Error('A GA4 Measurement Protocol envelope needs a nonempty events array.');
      if (entries.length + value.events.length > maxRecords) throw new Error('Use up to 60 captured events per comparison.');
      for (const event of value.events) {
        const classified = classify(event);
        entries.push(classified?.platform === 'ga4' ? classified : null);
      }
    } else {
      entries.push(classify(value));
    }
    if (entries.length > maxRecords) throw new Error('Use up to 60 captured events per comparison.');
  }
  return entries;
}

function activity(events, platform, expectedId, destination) {
  const relevant = events.filter((event) => event?.platform === platform).map(({ params }) => ({
    id: transactionId(params.transaction_id),
    value: observedAmount(params.value),
    numericLexemeAvailable: !record(params.value) || !Object.hasOwn(params.value, originalNumber) || typeof params.value[originalNumber] === 'string',
    currency: currencyCode(params.currency),
    destination: adsDestination(params.send_to),
  }));
  const target = platform === 'ga4' ? relevant : relevant.filter((event) => event.destination === destination);
  return {
    matching: target.filter((event) => event.id === expectedId),
    otherOrders: target.filter((event) => event.id && event.id !== expectedId).length,
    missingIds: target.filter((event) => !event.id).length,
    otherDestinations: platform === 'google_ads'
      ? relevant.filter((event) => event.id === expectedId && event.destination && event.destination !== destination).length : 0,
    missingDestinations: platform === 'google_ads'
      ? relevant.filter((event) => (!event.id || event.id === expectedId) && !event.destination).length : 0,
    skipped: events.length - relevant.length,
  };
}

function observationRow(field, expected, observed, status, detail = '') {
  return { field, expected, observed, status, detail };
}

const captureChecks = {
  unknown: {
    name: 'Unknown',
    next: 'Identify the intended purchase sender in Shopify. Check the Google & YouTube app’s conversion measurement settings and Settings → Customer events for a GTM custom pixel. If both are present, check which ones handle the same purchase destination.',
  },
  gtm: {
    name: 'GTM custom pixel',
    next: 'Repeat one checkout with Shopify Pixel Helper open. If it shows checkout_completed, enable Preserve log in DevTools and inspect the destination request for that same checkout. For Google Ads, compare both the conversion ID and its action label.',
    detail: 'Shopify Pixel Helper shows sandbox events. Tag Assistant’s Troubleshoot tag feature cannot see tags inside a custom pixel.',
  },
  google_app: {
    name: 'Google & YouTube app for Google Ads',
    next: 'Check the Checkout completed mapping in the Google & YouTube app and open that exact Purchase action under Google Ads → Goals → Conversions → Summary. Use action diagnostics as a status check and look for destination evidence tied to the same checkout.',
    detail: 'The supported app integration can send server-side. An empty browser log does not establish delivery or failure, and action diagnostics alone do not verify this order.',
  },
};

const checkoutObservations = {
  unknown: 'Not yet verified',
  seen: 'Seen for this checkout',
  not_seen: 'Not seen in the test used',
};

export function assessMissingCapture({ sender, checkout }) {
  if (!Object.hasOwn(captureChecks, sender) || !Object.hasOwn(checkoutObservations, checkout)) {
    throw new Error('Choose a purchase sender and what you observed during checkout.');
  }
  const check = captureChecks[sender];
  return {
    status: 'unverified',
    title: 'Purchase delivery unverified',
    summary: check.next,
    rows: [
      observationRow('Purchase sender', 'Intended integration', check.name, sender === 'unknown' ? 'unverified' : 'info', check.detail),
      observationRow('Shopify checkout event', 'checkout_completed', checkoutObservations[checkout], 'info', 'This is evidence from Shopify, separate from receipt at the destination.'),
      observationRow('Destination evidence', 'Purchase tied to the same checkout', 'Capture unavailable', 'unverified'),
    ],
    notes: [
      'If you obtain a destination payload, use Check event to compare the transaction ID, value and currency for the same checkout.',
      'For Google Ads, a test without an eligible ad interaction leaves ad attribution unverified.',
    ],
  };
}

function displayValues(events, field) {
  const values = [...new Set(events.map((event) => event[field]).filter(Boolean))];
  const visible = values.slice(0, 5).join(', ');
  const more = values.length > 5 ? `, +${values.length - 5} more` : '';
  const incomplete = Boolean(values.length) && events.some((event) => !event[field]) ? ' · Some unavailable' : '';
  return visible ? `${visible}${more}${incomplete}` : 'Unavailable';
}

function compareValue(events, expected, currency, basis, scoped) {
  const sameCurrency = events.filter((event) => event.currency === currency && event.value);
  if (!scoped || !basis || !events.length || !sameCurrency.length) {
    let detail = 'Inspect the matching payload for a JSON number in the expected currency.';
    if (!scoped) detail = 'Confirm this is the test checkout at the intended destination.';
    else if (!events.length) detail = 'Find the captured event for the expected transaction before checking its value.';
    else if (!basis) detail = 'Check that discounts, shipping and tax are treated the same in both values.';
    return observationRow('Purchase value', expected, displayValues(events, 'value'), 'unverified', detail);
  }
  const amountDiffers = sameCurrency.some((event) => event.value !== expected);
  const status = amountDiffers ? 'difference' : sameCurrency.length === events.length ? 'match' : 'unverified';
  const detail = amountDiffers ? 'Trace how the tag computed the value for this order, including discounts, shipping and tax.'
    : status === 'unverified' ? 'Inspect the other matching records for a numeric value in the expected currency.'
      : 'Compared in the expected currency.';
  return observationRow('Purchase value', expected, displayValues(events, 'value'), status, detail);
}

function compareCurrency(events, expected, scoped) {
  const currencies = events.map((event) => event.currency);
  const differs = currencies.some((value) => value && value !== expected);
  const complete = currencies.length > 0 && currencies.every(Boolean);
  const status = !scoped ? 'unverified' : differs ? 'difference' : complete ? 'match' : 'unverified';
  const detail = status === 'difference' ? 'Check whether the tag sends the checkout currency or the store’s default currency.'
    : !scoped ? 'Confirm the checkout and destination before interpreting the observed currency.'
      : !complete ? 'Inspect the matching payload for the three-letter currency code.' : '';
  return observationRow('Currency', expected, displayValues(events, 'currency'), status, detail);
}

function compareDestination(counts, scoped) {
  if (counts.matching.length) {
    return observationRow('Ads destination', 'Specified conversion action', 'Exact action match', scoped ? 'match' : 'unverified');
  }
  if (counts.otherDestinations) {
    return observationRow(
      'Ads destination', 'Specified conversion action', 'Same ID under a different action', scoped ? 'difference' : 'unverified',
      'Compare the tag’s conversion ID and label with the intended action. These records do not count as repeats for that action.',
    );
  }
  return observationRow('Ads destination', 'Specified conversion action', 'Unavailable for this order', 'unverified', 'Inspect the capture for the conversion action the tag actually used.');
}

export function comparePurchase(input) {
  const platform = input?.platform;
  if (platform !== 'ga4' && platform !== 'google_ads') throw new Error('Select GA4 or Google Ads.');
  const expectedId = transactionId(input.orderId);
  if (!expectedId) throw new Error('Enter the exact expected transaction ID as a nonempty string.');
  const expectedValue = amount(typeof input.value === 'string' ? input.value.trim() : '');
  if (!expectedValue) throw new Error('Enter a nonnegative expected value using a decimal point, such as 34.50.');
  const expectedCurrency = currencyCode(typeof input.currency === 'string' ? input.currency.trim().toUpperCase() : '');
  if (!expectedCurrency) throw new Error('Enter an expected currency using three letters, such as USD.');
  const destination = adsDestination(input.destination);
  if (platform === 'google_ads' && !destination) throw new Error('Enter the exact Google Ads action as AW-123/Label.');

  const events = eventRecords(readCapture(input.eventsText));
  const counts = activity(events, platform, expectedId, destination);
  const scoped = input.scopeConfirmed === true;
  const basis = input.usesSameValueBasis === true;
  const matching = counts.matching.length;
  const hasNoId = matching === 0 && counts.missingIds > 0;
  const idObserved = matching ? 'Exact ID found' : hasNoId ? 'ID missing or invalid' : counts.otherOrders ? 'Other order IDs only' : 'Exact ID not found';
  const idStatus = !scoped ? 'unverified' : matching ? 'match' : counts.otherOrders && !hasNoId ? 'difference' : 'unverified';
  const repeatStatus = !scoped || matching === 0 ? 'unverified' : matching > 1 ? 'difference' : 'match';
  const idDetail = matching ? 'The report omits the ID. The comparison checks exact case and punctuation.'
    : 'Check the transaction ID your integration sends for this specific checkout. The report omits the ID.';
  const rows = [observationRow('Transaction ID', 'Exact ID entered', idObserved, idStatus, idDetail)];
  if (platform === 'google_ads') rows.push(compareDestination(counts, scoped));
  rows.push(
    compareValue(counts.matching, expectedValue, expectedCurrency, basis, scoped),
    compareCurrency(counts.matching, expectedCurrency, scoped),
    observationRow('Matching records', '1', String(matching), repeatStatus, matching > 1
      ? 'Inspect which tags or integrations produced the repeated records in this capture.' : 'Counts matching records in this capture only.'),
  );
  if (counts.missingIds) rows.push(observationRow('Records without ID', '0', String(counts.missingIds), 'unverified', 'These records cannot be tied to the selected order.'));
  if (counts.missingDestinations) rows.push(observationRow('Records without an exact Ads action', '0', String(counts.missingDestinations), 'unverified', 'These records cannot be tied to the selected conversion action.'));
  if (counts.otherOrders) rows.push(observationRow('Other orders at this destination', 'Excluded', String(counts.otherOrders), 'info'));
  if (counts.otherDestinations) rows.push(observationRow('Same order at other Ads actions', 'Excluded', String(counts.otherDestinations), 'info'));
  if (counts.skipped) rows.push(observationRow('Other or unsupported records', 'Excluded', String(counts.skipped), 'info'));

  const notes = [];
  if (!scoped) notes.push('Confirm all records came from the same checkout test and measurement destination or action under review.');
  if (!basis) notes.push('Confirm the same discount, shipping and tax treatment between the reference amount and the event.');
  if (platform === 'ga4') notes.push('GA4 defines purchase value as the sum of item price × quantity, excluding shipping and tax. This comparison uses the supplied value field.');
  if (counts.matching.some((event) => !event.numericLexemeAvailable)) {
    notes.push('This browser cannot preserve captured JSON number precision. Open the tool in an up-to-date browser to verify the amount.');
  }
  if (matching > 1) notes.push('Repeated matching records show repeated payloads. Platform deduplication and reporting require separate evidence.');
  notes.push('This checks supplied fields. Delivery, deduplication, revenue reporting and attribution require separate verification.');
  const status = !scoped ? 'unverified' : rows.some((row) => row.status === 'difference') ? 'difference'
    : rows.some((row) => row.status === 'unverified') ? 'unverified' : 'match';
  const titles = { match: 'Captured values match', difference: 'Difference found in the capture', unverified: 'More evidence needed' };
  const summaries = {
    match: 'One scoped record matches the exact expected transaction, value and currency.',
    difference: 'Review the fields or repeated matching records below.',
    unverified: 'Check the capture scope and fill in missing or unsupported evidence before drawing a conclusion.',
  };
  return { status, title: titles[status], summary: summaries[status], rows, notes };
}
