const shippingSources = {
  offer: 'Offer-level shipping',
  account: 'Account-level shipping service',
  unknown: 'Shipping source unconfirmed',
};

const checkedFields = [
  'offer', 'country', 'source', 'region', 'observedAt', 'productAmount', 'productCurrency',
  'shippingAmount', 'shippingCurrency', 'shippingScope', 'shippingSource', 'checkoutAmount',
  'checkoutCurrency', 'checkoutScope', 'currentStatus', 'previousOffer', 'previousCountry',
  'previousSource', 'previousRegion', 'previousObservedAt', 'previousStatus',
];

function normalizeInputs(input) {
  return Object.fromEntries(checkedFields.map((field) => [
    field,
    typeof input?.[field] === 'string' ? input[field].trim() : '',
  ]));
}

function countryCode(value) {
  return /^[a-z]{2}$/i.test(value) ? value.toUpperCase() : '';
}

function money(amount, currency) {
  const validAmount = /^\d+(?:\.\d+)?$/.test(amount) ? amount : '';
  const validCurrency = /^[a-z]{3}$/i.test(currency) ? currency.toUpperCase() : '';
  return {
    amount: validAmount,
    currency: validCurrency,
    display: [validAmount, validCurrency].filter(Boolean).join(' ') || 'Not recorded',
  };
}

function canonicalAmount(value) {
  const [integer, fraction = ''] = value.split('.');
  const digits = integer.replace(/^0+(?=\d)/, '');
  const decimals = fraction.replace(/0+$/, '');
  return decimals ? `${digits}.${decimals}` : digits;
}

function observedTime(value) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/i.exec(value);
  if (!parts) return null;
  const [, year, month, day, zone] = parts;
  const calendarDate = Date.parse(`${year}-${month}-${day}T00:00:00Z`);
  const time = Date.parse(zone ? value : `${value}Z`);
  if (!Number.isFinite(calendarDate) || new Date(calendarDate).getUTCDate() !== Number(day) || !Number.isFinite(time)) {
    return null;
  }
  return { time, zoned: Boolean(zone) };
}

function shippingComparison(product, shipping, scope, source) {
  const label = 'Merchant Center shipping';
  const value = shipping.display;
  if (scope !== 'same') {
    const detail = scope === 'different'
      ? 'This shipping observation applies to a different country, offer or delivery condition.'
      : 'Confirm the shipping observation applies to this offer, destination and delivery condition.';
    return { label, value, detail, status: 'unknown' };
  }
  if (!product.currency || !shipping.currency) {
    return { label, value, detail: `${source}. A currency is missing or invalid.`, status: 'unknown' };
  }
  if (product.currency !== shipping.currency) {
    return {
      label, value, status: 'conflict',
      detail: `${source}. The supplied product currency is ${product.currency}; the supplied applicable shipping currency is ${shipping.currency}.`,
    };
  }
  return {
    label, value, status: 'match',
    detail: `${source}. The supplied product and applicable shipping currency are both ${shipping.currency}.`,
  };
}

function checkoutComparison(shipping, checkout, shippingScope, checkoutScope) {
  const label = 'Checkout shipping';
  const value = checkout.display;
  if (shippingScope !== 'same' || checkoutScope !== 'same') {
    const detail = checkoutScope === 'different'
      ? 'This checkout observation applies to a different offer, destination or delivery condition.'
      : 'Compare only after confirming both shipping observations apply to the same offer and delivery condition.';
    return { label, value, detail, status: 'unknown' };
  }
  if (!shipping.currency || !checkout.currency) {
    return { label, value, detail: 'A shipping currency is missing or invalid.', status: 'unknown' };
  }
  if (shipping.currency !== checkout.currency) {
    return {
      label, value, status: 'conflict',
      detail: `Merchant Center shipping uses ${shipping.currency}; checkout shipping uses ${checkout.currency}. Amounts were not compared across currencies.`,
    };
  }
  if (!shipping.amount || !checkout.amount) {
    return { label, value, detail: 'The currencies match. A shipping amount is missing or invalid.', status: 'unknown' };
  }
  if (canonicalAmount(shipping.amount) !== canonicalAmount(checkout.amount)) {
    return {
      label, value, status: 'conflict',
      detail: `Merchant Center shows ${shipping.display}; checkout shows ${checkout.display}. This is an observed difference.`,
    };
  }
  return { label, value, detail: 'The two supplied shipping amounts and currencies match.', status: 'match' };
}

function compareSnapshots(fields) {
  const currentKey = [fields.offer, countryCode(fields.country), fields.source, fields.region];
  const previousKey = [fields.previousOffer, countryCode(fields.previousCountry), fields.previousSource, fields.previousRegion];
  if (![...previousKey, fields.previousCountry, fields.previousObservedAt, fields.previousStatus].some(Boolean)) {
    return { title: 'No earlier snapshot', detail: 'Add an earlier observation to compare the status over time.', status: 'info' };
  }
  if (![...currentKey, ...previousKey].every(Boolean)) {
    return { title: 'Snapshots cannot be linked', detail: 'Both snapshots need an offer ID, country, data source and delivery condition.', status: 'unknown' };
  }
  if (!currentKey.every((value, index) => value === previousKey[index])) {
    return { title: 'Different snapshot keys', detail: 'The offer ID, country, data source or delivery condition differs. Statuses are shown as separate observations.', status: 'unknown' };
  }
  const currentTime = observedTime(fields.observedAt);
  const previousTime = observedTime(fields.previousObservedAt);
  if (!currentTime || !previousTime || currentTime.zoned !== previousTime.zoned || currentTime.time <= previousTime.time) {
    return { title: 'Snapshot order unconfirmed', detail: 'Enter valid times in the same time convention. The current observation must be later.', status: 'unknown' };
  }
  if (!fields.currentStatus || !fields.previousStatus) {
    return { title: 'Status comparison incomplete', detail: 'Enter the observed status for both snapshots.', status: 'unknown' };
  }
  if (fields.currentStatus === fields.previousStatus) {
    return { title: 'Status unchanged', detail: `Both linked observations report ${fields.currentStatus}.`, status: 'info' };
  }
  return {
    title: 'Status changed', status: 'info',
    detail: `${fields.previousStatus} → ${fields.currentStatus}. This records the observed change between linked snapshots.`,
  };
}

export function diagnose(input) {
  const fields = normalizeInputs(input);
  const product = money(fields.productAmount, fields.productCurrency);
  const shipping = money(fields.shippingAmount, fields.shippingCurrency);
  const checkout = money(fields.checkoutAmount, fields.checkoutCurrency);
  const source = Object.hasOwn(shippingSources, fields.shippingSource) && fields.shippingSource !== 'unknown'
    ? shippingSources[fields.shippingSource]
    : shippingSources.unknown;
  const rows = [
    {
      label: 'Merchant Center product price', value: product.display, status: 'info',
      detail: 'The final product price entered for the selected offer.',
    },
    shippingComparison(product, shipping, fields.shippingScope, source),
    checkoutComparison(shipping, checkout, fields.shippingScope, fields.checkoutScope),
    {
      label: 'Current item status', value: fields.currentStatus || 'Not recorded', status: 'info',
      detail: 'The status entered for the current observation.',
    },
  ];
  const gaps = [];
  if (!fields.offer || !countryCode(fields.country) || !fields.region) {
    gaps.push('Identify the exact offer ID, target country and delivery conditions.');
  }
  if (!product.amount || !product.currency) gaps.push('Enter a valid product amount and its three-letter currency.');
  if (!shipping.amount || !shipping.currency) gaps.push('Enter a valid Merchant Center shipping amount and currency.');
  if (!checkout.amount || !checkout.currency) gaps.push('Enter a valid checkout shipping amount and currency.');
  if (source === shippingSources.unknown) gaps.push('Identify the applicable offer-level entry or account shipping service.');
  if (fields.shippingScope !== 'same') gaps.push('Confirm the Merchant Center shipping entry applies to this case.');
  if (fields.checkoutScope !== 'same') gaps.push('Capture checkout for the same offer, destination and delivery condition.');

  const hasConflict = rows.some(({ status }) => status === 'conflict');
  const outcome = hasConflict ? 'conflict' : gaps.length ? 'unknown' : 'match';
  const outcomeCopy = {
    conflict: ['Difference found', 'The supplied evidence shows a currency or amount difference. Use the comparison to choose what to verify next.'],
    unknown: ['More evidence needed', 'Complete the missing evidence before concluding that Merchant Center and checkout agree.'],
    match: ['Supplied values match', 'Merchant Center product and shipping currencies match. The supplied checkout shipping amount and currency also match.'],
  };
  const [title, summary] = outcomeCopy[outcome];
  const steps = [
    'Open the same offer in Merchant Center and record its final product price, currency and current status.',
    'Check whether an offer-level shipping price applies to this destination. If no offer-level price applies, identify the matching account shipping service.',
    'Repeat checkout with the same variant, destination and delivery conditions. Record the applicable shipping amount and currency.',
    'After a new sync, capture a later observation using the same offer ID, country, data source and delivery conditions.',
  ];
  return { outcome, title, summary, rows, gaps, steps, sync: compareSnapshots(fields) };
}
