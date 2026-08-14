export type PoemLineKind = "line" | "gap" | "marker";

export type FormattedPoemLine = {
  kind: PoemLineKind;
  text: string;
  explicitIndent: number;
  autoIndent: number;
};

const STANZA_MARKERS = new Set(["＜", "<"]);

function preserveSourceLine(rawLine: string) {
  return { text: rawLine, explicitIndent: 0 };
}

/**
 * Enter로 나뉜 논리 행을 각각 독립된 행으로 반환합니다.
 * 자동 들여쓰기는 더 이상 적용하지 않으며, 원문에 있던 모든 일반·연속·전각 공백을 그대로 보존합니다.
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
      result.push({ kind: "marker", text: rawLine, explicitIndent: 0, autoIndent: 0 });
      continue;
    }

    const { text, explicitIndent } = preserveSourceLine(rawLine);
    result.push({ kind: "line", text, explicitIndent, autoIndent: 0 });
  }

  return result;
}

export function getEffectiveIndent(line: FormattedPoemLine) {
  return Math.max(line.explicitIndent, line.autoIndent);
}

export function getDisplayIndentStyle(line: FormattedPoemLine) {
  return line.explicitIndent > 0 ? { paddingLeft: `${line.explicitIndent}em` } : undefined;
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
  return "Enter 줄바꿈과 원문의 공백을 그대로 표시합니다. 화면에서 감싸지는 긴 행의 이어지는 줄에는 자동 내어쓰기를 적용합니다.";
}
