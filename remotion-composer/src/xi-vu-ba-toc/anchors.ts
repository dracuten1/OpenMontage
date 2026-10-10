// Speech-lock anchor engine (owner's permanent rule 2026-10-04):
// every animated element fires when its word is SPOKEN, using the per-word
// GLOBAL timestamps from the canonical-aligned transcript (word.start = global
// seconds, verified: s02 first word start 28.98 ≈ global_start 29.1).
// Anchor picks verified by projects/xi-vu-ba-toc/scripts/check_anchors.py
// (regex-extracts every A("word", occ) call and checks it resolves inside the
// calling scene's frame window; a missing anchor throws at render time).
import narrationWords from "../../public/xi-vu-ba-toc/transcripts/narration_words.json";
import { FPS } from "./theme";

export type WordEntry = { word: string; start: number; end: number };

const SECTIONS: Record<string, WordEntry[]> = {};
let lastEnd = 0;
// narration_words.json (Ep.06): { [sectionId]: WordEntry[] & {local_*} } — array per key.
for (const [key, value] of Object.entries(
  narrationWords as unknown as Record<string, WordEntry[]>
)) {
  const arr = Array.isArray(value) ? value : ((value as unknown as { words: WordEntry[] }).words ?? []);
  SECTIONS[key] = arr.map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));
  for (const w of SECTIONS[key]) lastEnd = Math.max(lastEnd, w.end);
}

/** global end time (seconds) of the last spoken word in the full narration */
export const LAST_WORD_END = lastEnd;

/** strip punctuation + lowercase so «Mân-Việt.» matches "Mân Việt" / "mân" */
const norm = (s: string): string =>
  s
    .replace(/[«»“”"'’.,;:!?…()[\]{}—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** global start time (seconds) of the occ-th spoken `word` inside `section`. Throws if missing.
 *  Matches a single word OR a multi-word phrase (consecutive spoken words joined by space). */
export const wordStart = (section: string, word: string, occ = 1): number => {
  const words = SECTIONS[section];
  if (!words) throw new Error(`ANCHOR MISS section: ${section} (word "${word}")`);
  const target = norm(word);
  let seen = 0;
  if (target.includes(" ")) {
    // skip words that normalize to empty (e.g. "—"); greedy-join words so a word
    // that normalizes to multiple tokens (e.g. "H'Mông" -> "h mông") still matches
    const idx: number[] = [];
    const n: string[] = [];
    words.forEach((w, i) => {
      const t = norm(w.word);
      if (t) { idx.push(i); n.push(t); }
    });
    for (let i = 0; i < n.length; i++) {
      let joined = n[i];
      let j = i;
      while (joined.length < target.length && j + 1 < n.length) {
        j += 1;
        joined += " " + n[j];
      }
      if (joined === target && ++seen === occ) {
        return words[idx[i]].start;
      }
    }
    throw new Error(
      `ANCHOR MISS: ${section} "${word}" #${occ} (found ${seen} occurrence(s) of "${target}")`
    );
  }
  for (const w of words) {
    if (norm(w.word) === target && ++seen === occ) return w.start;
  }
  throw new Error(
    `ANCHOR MISS: ${section} "${word}" #${occ} (found ${seen} occurrence(s) of "${target}")`
  );
};

/** global frame of an anchor (fps 30). */
export const wordFrame = (section: string, word: string, occ = 1): number =>
  Math.round(wordStart(section, word, occ) * FPS);
