// Parses and compares school-level fraction answers: "3/4", "1 1/2", "1_1/2", "2", "0,5".

export type Fraction = { num: number; den: number };

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function reduce({ num, den }: Fraction): Fraction {
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return { num: (sign * num) / g, den: (sign * den) / g };
}

/** Normalizes OCR-ish noise: unicode slashes/minus, comma decimals, extra spaces. */
export function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .replace(/[⁄∕÷]/g, "/")
    .replace(/[−–—]/g, "-")
    .replace(/,/g, ".")
    .replace(/\s*\/\s*/g, "/")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

export function parseFraction(raw: string): Fraction | null {
  const s = normalizeAnswer(raw);
  if (!s) return null;

  // Mixed number: "1 1/2" or "-1 1/2"
  let m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (m) {
    const [, neg, whole, n, d] = m;
    if (+d === 0) return null;
    const num = +whole * +d + +n;
    return reduce({ num: neg ? -num : num, den: +d });
  }

  // Simple fraction: "3/4"
  m = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (m) {
    if (+m[2] === 0) return null;
    return reduce({ num: +m[1], den: +m[2] });
  }

  // Integer or decimal: "2", "0.5"
  m = s.match(/^-?\d+(\.\d+)?$/);
  if (m) {
    const decimals = m[1] ? m[1].length - 1 : 0;
    const den = 10 ** decimals;
    return reduce({ num: Math.round(parseFloat(s) * den), den });
  }

  // Comparison answers for "compare fractions" tasks
  return null;
}

const COMPARISON = new Set([">", "<", "="]);

/**
 * True when the student's answer equals the expected one by value (2/4 == 1/2 == 0.5).
 * With `exactForm`, the written form must match too — used where the form IS the skill
 * (reducing a fraction, writing a mixed number), so "4/6" is wrong when "2/3" is expected.
 */
export function isCorrect(read: string, expected: string, exactForm = false): boolean {
  const a = normalizeAnswer(read);
  const b = normalizeAnswer(expected);
  if (COMPARISON.has(b) || exactForm) return a === b;

  const fa = parseFraction(a);
  const fb = parseFraction(b);
  if (!fa || !fb) return a.toLowerCase() === b.toLowerCase();
  return fa.num === fb.num && fa.den === fb.den;
}

export function formatFraction({ num, den }: Fraction): string {
  return den === 1 ? String(num) : `${num}/${den}`;
}
