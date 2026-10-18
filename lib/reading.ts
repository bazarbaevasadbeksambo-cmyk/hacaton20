// Compares what the student read aloud with the original text, word by word.

export type WordStatus = "ok" | "missed" | "wrong";
export type WordMark = { word: string; status: WordStatus };

/** Lowercase, unify apostrophes (o'qish / oʻqish / o’qish), drop punctuation. */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[ʻʼ’‘`´]/g, "'")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}']/gu, "");
}

const words = (text: string) => text.split(/\s+/).filter((w) => normalizeWord(w));

/**
 * Longest-common-subsequence alignment. Original words outside the LCS are "wrong"
 * when the reader said something else in their place, otherwise "missed".
 */
export function compareReading(original: string, recognized: string) {
  const orig = words(original);
  const rec = words(recognized).map(normalizeWord);
  const a = orig.map(normalizeWord);
  const n = a.length;
  const m = rec.length;

  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === rec[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const marks: WordMark[] = [];
  let i = 0;
  let j = 0;
  let gapOrig: number[] = [];
  let gapRec = 0;
  const flushGap = () => {
    gapOrig.forEach((idx, k) => marks.push({ word: orig[idx], status: k < gapRec ? "wrong" : "missed" }));
    gapOrig = [];
    gapRec = 0;
  };

  while (i < n || j < m) {
    if (i < n && j < m && a[i] === rec[j]) {
      flushGap();
      marks.push({ word: orig[i], status: "ok" });
      i++;
      j++;
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      gapRec++;
      j++;
    } else {
      gapOrig.push(i);
      i++;
    }
  }
  flushGap();

  return { marks, correct: marks.filter((x) => x.status === "ok").length, total: orig.length };
}
