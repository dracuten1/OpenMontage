// Speech-locked word-cue resolution for Remotion scenes.
// Matches spoken Vietnamese/English phrases from public/<slug>/cues.json
// to exact scene-local frames so animations open in sync with narration.

export interface AlignedCueToken {
  word: string;
  start: number;
  end: number;
  start_frame: number;
  end_frame: number;
}

export type CuesMap = Record<string, AlignedCueToken[]>;

export function normalizeCueToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

function tokensMatch(tokenNorm: string, needleNorm: string): boolean {
  if (!tokenNorm || !needleNorm) return false;
  if (tokenNorm === needleNorm) return true;
  if (needleNorm.length >= 2 && tokenNorm.includes(needleNorm)) return true;
  if (tokenNorm.length >= 2 && needleNorm.includes(tokenNorm)) return true;
  return false;
}

export function resolveCueFrame(
  cues: CuesMap | undefined,
  sectionId: string,
  phrase: string,
  fallbackFrame = 0,
  leadFrames = 3,
): number {
  const tokens = cues?.[sectionId.toLowerCase()] ?? cues?.[sectionId];
  if (!tokens || tokens.length === 0) {
    return Math.max(0, fallbackFrame);
  }
  const needles = phrase
    .split(/\s+/)
    .map(normalizeCueToken)
    .filter(Boolean);
  if (needles.length === 0) {
    return Math.max(0, fallbackFrame);
  }

  const hay = tokens.map((t) => normalizeCueToken(t.word));
  for (let i = 0; i <= hay.length - needles.length; i++) {
    let ok = true;
    for (let j = 0; j < needles.length; j++) {
      if (!tokensMatch(hay[i + j], needles[j])) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return Math.max(0, tokens[i].start_frame - leadFrames);
    }
  }
  return Math.max(0, fallbackFrame);
}
