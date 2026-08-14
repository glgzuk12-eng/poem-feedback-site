export type PoemProfile = "STANDARD" | "LONG" | "PROSE" | "SHAPED";

export type PoemLayoutLine = {
  text: string;
  indent: number;
  marker?: boolean;
};

export type PoemStanza = {
  lines: PoemLayoutLine[];
};

export type PoemLayoutSpec = {
  version: 1;
  profile: PoemProfile;
  measure: number;
  turnover: number;
  fitWidth: number;
  justify: boolean;
  stanzaGap: number;
  stanzas: PoemStanza[];
  autoDetected: boolean;
  overflowWrapAnywhere: boolean;
  metrics: {
    lineCount: number;
    blankRatio: number;
    endPunctRatio: number;
    wMedian: number;
    wP90: number;
    wMax: number;
    indentLevels: number;
    indentMax: number;
    maxTokenWidth: number;
    latinRatio: number;
  };
};

const WIDE_RANGES: Array<[number, number]> = [
  [0x1100, 0x115f],
  [0x2e80, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xff00, 0xff60],
];

function isWideCodePoint(codePoint: number) {
  return WIDE_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}

/** 한글·한자·전각은 1em, 그 외 문자는 0.5em으로 환산합니다. */
export function visualWidth(value: string) {
  let width = 0;
  for (const character of Array.from(value)) {
    if (character === "\t") {
      width += 2;
      continue;
    }
    const codePoint = character.codePointAt(0) ?? 0;
    width += isWideCodePoint(codePoint) ? 1 : 0.5;
  }
  return width;
}

function leadingIndent(rawLine: string) {
  const match = rawLine.match(/^[\t \u3000]*/)?.[0] ?? "";
  return visualWidth(match.replace(/\t/g, "    "));
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function countLatin(value: string) {
  return Array.from(value).filter((character) => /[A-Za-z]/.test(character)).length;
}

function hasTerminalPunctuation(value: string) {
  return /[.?!.…。？！]$/.test(value.trim());
}

function splitSourceLines(content: string) {
  return content.replace(/\r\n?/g, "\n").split("\n");
}

function makeStanzas(lines: string[]): PoemStanza[] {
  const stanzas: PoemStanza[] = [];
  let current: PoemLayoutLine[] = [];
  const flush = () => {
    if (current.length > 0) {
      stanzas.push({ lines: current });
      current = [];
    }
  };

  for (const rawLine of lines) {
    if (rawLine.trim() === "") {
      flush();
      continue;
    }
    const marker = rawLine.trim() === "＜" || rawLine.trim() === "<";
    current.push({ text: rawLine, indent: leadingIndent(rawLine), ...(marker ? { marker: true } : {}) });
  }
  flush();
  return stanzas;
}

/**
 * 논리행은 원문의 Enter로 구분된 행이며, 시각행은 CSS가 폭을 넘겨 접은 결과입니다.
 * 이 함수는 등록·수정 시 한 번 실행되고, 열람 시에는 저장된 layoutSpec만 사용합니다.
 */
export function analyzePoem(content: string): PoemLayoutSpec {
  const sourceLines = splitSourceLines(content);
  const nonBlankLines = sourceLines.filter((line) => line.trim() !== "");
  const widths = nonBlankLines.map((line) => visualWidth(line.replace(/^[\t \u3000]*/, "")));
  const indents = nonBlankLines.map(leadingIndent);
  const tokenWidths = nonBlankLines.flatMap((line) =>
    line.trim().split(/\s+/).filter(Boolean).map(visualWidth),
  );
  const totalCharacters = Array.from(nonBlankLines.join("")).length;
  const latinCharacters = nonBlankLines.reduce((sum, line) => sum + countLatin(line), 0);
  const blankCount = sourceLines.length - nonBlankLines.length;
  const wMedian = percentile(widths, 0.5);
  const wP90 = percentile(widths, 0.9);
  const wMax = widths.length > 0 ? Math.max(...widths) : 0;
  const indentValues = Array.from(new Set(indents.filter((indent) => indent > 0)));
  const indentMax = indents.length > 0 ? Math.max(...indents) : 0;
  const endPunctRatio = nonBlankLines.length > 0
    ? nonBlankLines.filter(hasTerminalPunctuation).length / nonBlankLines.length
    : 0;
  const blankRatio = sourceLines.length > 0 ? blankCount / sourceLines.length : 0;
  const maxTokenWidth = tokenWidths.length > 0 ? Math.max(...tokenWidths) : 0;
  const latinRatio = totalCharacters > 0 ? latinCharacters / totalCharacters : 0;

  let profile: PoemProfile = "STANDARD";
  if (indentValues.length >= 3 || indentMax >= 8) {
    profile = "SHAPED";
  } else if (wMedian >= 40 && endPunctRatio >= 0.5 && indentValues.length <= 1) {
    profile = "PROSE";
  } else if (wP90 >= 26 || wMax > 60) {
    profile = "LONG";
  }

  const turnover = profile === "SHAPED" || profile === "PROSE"
    ? 0
    : profile === "LONG"
      ? (wMax > 60 ? 2.4 : 2)
      : 1.4;
  const measure = profile === "SHAPED"
    ? Math.max(12, Math.ceil(wMax + 2))
    : profile === "PROSE"
      ? 34
      : Math.min(profile === "LONG" ? 36 : 30, Math.max(18, wP90 + 2));
  const fitWidth = Math.max(18, Math.ceil(Math.min(measure, wP90 + 2)));
  const justify = profile === "PROSE" && wP90 >= 40;

  return {
    version: 1,
    profile,
    measure,
    turnover,
    fitWidth,
    justify,
    stanzaGap: profile === "LONG" ? 1.8 : profile === "PROSE" ? 1.4 : 1.6,
    stanzas: makeStanzas(sourceLines),
    autoDetected: true,
    overflowWrapAnywhere: maxTokenWidth > measure || maxTokenWidth > 20,
    metrics: {
      lineCount: sourceLines.length,
      blankRatio,
      endPunctRatio,
      wMedian,
      wP90,
      wMax,
      indentLevels: indentValues.length,
      indentMax,
      maxTokenWidth,
      latinRatio,
    },
  };
}

export function withPoemLayoutOverrides(
  layout: PoemLayoutSpec,
  overrides: Partial<Pick<PoemLayoutSpec, "profile" | "turnover" | "measure" | "justify">>,
): PoemLayoutSpec {
  const profile = overrides.profile ?? layout.profile;
  const turnover = overrides.turnover ?? layout.turnover;
  const measure = overrides.measure ?? layout.measure;
  return {
    ...layout,
    profile,
    turnover,
    measure,
    justify: overrides.justify ?? layout.justify,
    autoDetected: false,
    overflowWrapAnywhere: layout.overflowWrapAnywhere,
  };
}

export function getDefaultPoemLayout(content: string) {
  return analyzePoem(content);
}
