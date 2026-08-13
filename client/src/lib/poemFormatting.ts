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

/**
 * 각 논리 행의 첫 시각 행에만 자동 들여쓰기를 적용합니다.
 * `text-indent`를 사용하므로 한 논리 행이 화면에서 여러 줄로 감싸져도
 * 첫 줄만 안쪽으로 들어가고, 이어지는 시각 행은 본문 시작선에 맞습니다.
 * 전각 공백·기존 두 칸 공백은 명시적 들여쓰기로 보존합니다.
 */
export function formatPoemLines(content: string): FormattedPoemLine[] {
  const result: FormattedPoemLine[] = [];

  for (const rawLine of content.replace(/\r\n?/g, "\n").split("\n")) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      result.push({ kind: "gap", text: "", explicitIndent: 0, autoIndent: 0 });
      continue;
    }

    if (STANZA_MARKERS.has(trimmed)) {
      result.push({ kind: "marker", text: trimmed, explicitIndent: 0, autoIndent: 0 });
      continue;
    }

    const { text, explicitIndent } = parseIndent(rawLine);
    result.push({ kind: "line", text, explicitIndent, autoIndent: explicitIndent === 0 ? 1 : 0 });
  }

  return result;
}

export function getEffectiveIndent(line: FormattedPoemLine) {
  return Math.max(line.explicitIndent, line.autoIndent);
}

export function getDisplayIndentStyle(line: FormattedPoemLine) {
  const style: { paddingLeft?: string; textIndent?: string } = {};
  if (line.explicitIndent > 0) style.paddingLeft = `${line.explicitIndent}em`;
  if (line.autoIndent > 0) style.textIndent = `${line.autoIndent}em`;
  return Object.keys(style).length > 0 ? style : undefined;
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
  return "각 행의 첫 시각 행에 자동 들여쓰기가 적용됩니다. 화면에서 줄이 감싸져도 이어지는 줄은 본문 시작선에 맞습니다.";
}
