const DATE_RE = /^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}$/;
const TIME_RE = /^\d{1,2}:\d{2}\s*(am|pm)$/i;
const TYPE_RE = /^(DEBIT|CREDIT)$/i;
const AMOUNT_RE = /^₹\s?[\d,]+(?:\.\d+)?$/;
const ENTRY_STOP_RE = /^(Transaction ID|UTR No\.|Paid by|Received in|Credited to|Debited from|Page \d+ of \d+|This is a system generated statement)/i;

const MONTHS = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const CATEGORY_KEYWORDS = {
  food: [
    'cafe', 'coffee', 'restaurant', 'hotel', 'dine', 'food', 'meal', 'breakfast',
    'lunch', 'dinner', 'veg', 'vegetable', 'vegetables', 'grocery', 'groceries',
    'supermarket', 'mart', 'swiggy', 'zomato', 'zepto', 'blinkit', 'instamart',
    'nalapaka', 'udupi',
  ],
  travel: [
    'bus', 'bmtc', 'train', 'metro', 'flight', 'air', 'airport', 'trip', 'travel',
    'hotel stay', 'irctc', 'ola outstation', 'uber intercity',
  ],
  transport: [
    'taxi', 'cab', 'uber', 'ola', 'auto', 'rapido', 'fuel', 'petrol', 'diesel',
    'parking', 'toll',
  ],
  shopping: [
    'amazon', 'flipkart', 'myntra', 'ajio', 'store', 'mall', 'marketplace',
    'shopping', 'purchase',
  ],
  utilities: [
    'electricity', 'water bill', 'gas bill', 'broadband', 'wifi', 'internet',
    'recharge', 'mobile bill', 'utility', 'bescom',
  ],
  entertainment: [
    'movie', 'cinema', 'netflix', 'spotify', 'hotstar', 'prime video', 'game',
    'play', 'bookmyshow',
  ],
  health: [
    'pharmacy', 'medical', 'hospital', 'clinic', 'doctor', 'apollo', 'medicine',
  ],
  education: [
    'course', 'tuition', 'fees', 'exam', 'udemy', 'coursera', 'school', 'college',
  ],
  rent: [
    'rent', 'landlord', 'maintenance',
  ],
  insurance: [
    'insurance', 'policy', 'premium',
  ],
  investment: [
    'mutual fund', 'sip', 'stocks', 'zerodha', 'groww', 'coin', 'investment',
  ],
  salary: [
    'salary', 'payroll', 'wages',
  ],
  freelance: [
    'freelance', 'consulting', 'client payment',
  ],
  business: [
    'business', 'invoice', 'vendor payment',
  ],
  gift: [
    'gift', 'bonus', 'reward', 'cashback',
  ],
  rental: [
    'rent received', 'tenant',
  ],
  dividends: [
    'dividend', 'interest payout',
  ],
};

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseAmount(value) {
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStatementDate(rawDate) {
  const match = rawDate.match(/^([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return '';
  const [, monthLabel, day, year] = match;
  const monthIndex = MONTHS[monthLabel];
  if (monthIndex === undefined) return '';
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
}

function cleanDescription(description) {
  return normalizeWhitespace(
    description
      .replace(/^(Paid to|Received from|Paid by|Transferred to|Transferred from|Sent to|Received via)\s+/i, '')
      .replace(/\s+Transaction ID.*$/i, '')
  );
}

function scoreCategory(text, keywords) {
  return keywords.reduce((score, keyword) => {
    if (!text.includes(keyword)) return score;
    return score + (text === keyword ? 3 : 1);
  }, 0);
}

export function inferTransactionCategory(type, description) {
  const normalized = normalizeWhitespace(description).toLowerCase();
  if (!normalized) return type === 'income' ? 'other_inc' : 'other_exp';

  const candidates = Object.entries(CATEGORY_KEYWORDS)
    .filter(([id]) => type === 'income'
      ? ['salary', 'freelance', 'business', 'gift', 'rental', 'dividends'].includes(id)
      : !['salary', 'freelance', 'business', 'gift', 'rental', 'dividends'].includes(id))
    .map(([id, keywords]) => ({ id, score: scoreCategory(normalized, keywords) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length > 0) return candidates[0].id;
  return type === 'income' ? 'other_inc' : 'other_exp';
}

function extractDescription(lines, amountIndex, boundaryIndex) {
  const details = [];
  for (let index = amountIndex + 1; index < boundaryIndex; index += 1) {
    const line = lines[index];
    if (ENTRY_STOP_RE.test(line)) break;
    if (TYPE_RE.test(line) || AMOUNT_RE.test(line) || TIME_RE.test(line)) continue;
    details.push(line);
  }
  return cleanDescription(details.join(' '));
}

function isEntryStart(lines, index) {
  return DATE_RE.test(lines[index] || '') && TIME_RE.test(lines[index + 1] || '');
}

export function parseStatementText(text) {
  const lines = text
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const transactions = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!isEntryStart(lines, index)) continue;

    const rawDate = lines[index];
    let type = null;
    let amount = null;
    let typeIndex = -1;
    let amountIndex = -1;
    let boundaryIndex = lines.length;

    for (let cursor = index + 2; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];

      if (cursor > index + 2 && isEntryStart(lines, cursor)) {
        boundaryIndex = cursor;
        break;
      }

      if (typeIndex === -1 && TYPE_RE.test(line)) {
        type = line.toUpperCase() === 'CREDIT' ? 'income' : 'expense';
        typeIndex = cursor;
        continue;
      }

      if (typeIndex !== -1 && amountIndex === -1 && AMOUNT_RE.test(line)) {
        amount = parseAmount(line);
        amountIndex = cursor;
      }
    }

    if (!type || !amount || amountIndex === -1) continue;

    const note = extractDescription(lines, amountIndex, boundaryIndex);
    const date = parseStatementDate(rawDate);
    if (!note || !date) continue;

    transactions.push({
      date,
      amount,
      type,
      note,
      category: inferTransactionCategory(type, note),
      source: 'pdf-import',
    });

    index = boundaryIndex - 1;
  }

  return transactions;
}

export async function extractTextFromPdf(file) {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join('\n'));
  }

  return pages.join('\n');
}

export async function parseStatementPdf(file) {
  const text = await extractTextFromPdf(file);
  const transactions = parseStatementText(text);

  return {
    transactions,
    text,
  };
}

export function getTransactionFingerprint(transaction) {
  return [
    transaction.date,
    transaction.type,
    Number(transaction.amount).toFixed(2),
    normalizeWhitespace(transaction.note || '').toLowerCase(),
  ].join('|');
}
