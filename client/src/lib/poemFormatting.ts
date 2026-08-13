export type PoemLineKind = "line" | "gap" | "marker";

export type FormattedPoemLine = {
  kind: PoemLineKind;
  text: string;
  explicitIndent: number;
  autoIndent: number;
};

const STANZA_MARKERS = new Set(["＜", "<"]);

function parseIndent(rawLine: string) {
  let text = rawLine;
  let explicitIndent = 0;

  while (text.startsWith("　")) {
    explicitIndent += 1;
    text = text.slice(1);
  }

  if (explicitIndent === 0) {
    const match = text.match(/^( {2})+/);
    if (match) {
      explicitIndent = match[0].length / 2;
      text = text.slice(match[0].length);
    }
  }

  return { text, explicitIndent };
}

/** 빈 줄 또는 ＜/<를 연 경계로 삼고, 두 줄 이상 연의 첫 행만 자동 들여씁니다. */
export function formatPoemLines(content: string): FormattedPoemLine[] {
  const result: FormattedPoemLine[] = [];
  let stanzaIndexes: number[] = [];

  const finishStanza = () => {
    if (stanzaIndexes.length >= 2) {
      const first = result[stanzaIndexes[0]];
      if (first && first.explicitIndent === 0) first.autoIndent = 1;
    }
    stanzaIndexes = [];
  };

  for (const rawLine of content.replace(/\r\n?/g, "\n").split("\n")) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      finishStanza();
      result.push({ kind: "gap", text: "", explicitIndent: 0, autoIndent: 0 });
      continue;
    }

    if (STANZA_MARKERS.has(trimmed)) {
      finishStanza();
      result.push({ kind: "marker", text: trimmed, explicitIndent: 0, autoIndent: 0 });
      continue;
    }

    const { text, explicitIndent } = parseIndent(rawLine);
    result.push({ kind: "line", text, explicitIndent, autoIndent: 0 });
    stanzaIndexes.push(result.length - 1);
  }

  finishStanza();
  return result;
}

export function getEffectiveIndent(line: FormattedPoemLine) {
  return Math.max(line.explicitIndent, line.autoIndent);
}

export function getDisplayIndentStyle(line: FormattedPoemLine) {
  const indent = getEffectiveIndent(line);
  return indent > 0 ? { paddingLeft: `${indent}em` } : undefined;
}

export function addOneIndent(line: string) {
  return `　${line}`;
}

export function removeOneIndent(line: string) {
  if (line.startsWith("　")) return line.slice(1);
  if (line.startsWith("  ")) return line.slice(2);
  return line;
}

export function findLineIndexAtPosition(content: string, position: number) {
  const lines = content.split("\n");
  let offset = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const end = offset + lines[index].length;
    if (position <= end) return index;
    offset = end + 1;
  }
  return Math.max(0, lines.length - 1);
}

export function indentSelectedLines(content: string, start: number, end: number, direction: "in" | "out") {
  const lines = content.split("\n");
  const first = findLineIndexAtPosition(content, start);
  const last = findLineIndexAtPosition(content, Math.max(start, end - 1));
  for (let index = first; index <= last; index += 1) {
    lines[index] = direction === "in" ? addOneIndent(lines[index]) : removeOneIndent(lines[index]);
  }
  return lines.join("\n");
}

export function isStanzaMarker(line: string) {
  return STANZA_MARKERS.has(line.trim());
}

export function getPoemIndentHint() {
  return "두 줄 이상인 연의 첫 행에 자동 들여쓰기가 적용됩니다.";
}
