import { describe, expect, it } from "vitest";
import { formatPoemLines, getEffectiveIndent, indentSelectedLines } from "../client/src/lib/poemFormatting";

describe("poem formatting", () => {
  it("adds automatic indent only to the first line of a multi-line stanza", () => {
    const lines = formatPoemLines("첫 줄\n둘째 줄\n셋째 줄");
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([1, 0, 0]);
  });

  it("does not indent a one-line stanza", () => {
    const lines = formatPoemLines("한 줄\n\n다른 한 줄");
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([0, 0, 0]);
  });

  it("keeps standalone stanza markers", () => {
    const lines = formatPoemLines("첫 줄\n둘째 줄\n＜\n새 연");
    expect(lines[0].autoIndent).toBe(1);
    expect(lines[2]).toMatchObject({ kind: "marker", text: "＜" });
    expect(lines[3].autoIndent).toBe(0);
  });

  it("preserves explicit full-width and legacy indentation", () => {
    const lines = formatPoemLines("　명시적 첫 줄\n둘째 줄\n\n  기존 첫 줄\n  기존 둘째 줄");
    expect(lines[0]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
    expect(lines[3]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
    expect(lines[4].autoIndent).toBe(0);
  });

  it("applies indentation to every selected line", () => {
    const content = "첫 줄\n둘째 줄\n셋째 줄";
    const result = indentSelectedLines(content, 0, content.length, "in");
    expect(result).toBe("　첫 줄\n　둘째 줄\n　셋째 줄");
  });
});
