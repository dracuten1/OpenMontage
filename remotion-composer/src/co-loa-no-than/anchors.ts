// Speech-lock anchor engine (owner's permanent rule 2026-10-04):
// every animated element fires when its word is SPOKEN, using the per-word
// timestamps from the Whisper+canonical-alignment transcript — never estimates.
//
// Anchor picks are verified one-shot by projects/co-loa-no-than/scripts/check_anchors.py
// (regex-extracts every A("word", occ) call from the scene TSX and checks it resolves
// inside the calling scene's frame window ±0.3s). A missing anchor throws at render
// time — that crash-at-minute-20 lesson (aivn) is why the scan exists.
import narrationWords from "../../public/co-loa-no-than/transcripts/narration_words.json";
import { FPS } from "./theme";

export type WordEntry = { word: string; start: number; end: number };

const SECTIONS: Record<string, WordEntry[]> = {};
let lastEnd = 0;
for (const [key, value] of Object.entries(
  narrationWords as Record<string, { words: WordEntry[] }>
)) {
  SECTIONS[key] = (value.words ?? []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));
  for (const w of SECTIONS[key]) lastEnd = Math.max(lastEnd, w.end);
}

/** global end time (seconds) of the last spoken word in the full narration */
export const LAST_WORD_END = lastEnd;

/** strip punctuation so «Văn-Lang.» matches "Văn Lang" / "Văn-Lang" */
const norm = (s: string): string =>
  s
    .replace(/[«»“”"'’.,;:!?…()[\]{}—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** global start time (seconds) of the occ-th spoken `word` inside `section`. Throws if missing. */
export const wordStart = (section: string, word: string, occ = 1): number => {
  const words = SECTIONS[section];
  if (!words) throw new Error(`ANCHOR MISS section: ${section} (word "${word}")`);
  const target = norm(word);
  let seen = 0;
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
