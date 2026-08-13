import { describe, expect, it } from "vitest";
import {
  formatPoemLines,
  getDisplayIndentStyle,
  getEffectiveIndent,
  indentSelectedLines,
} from "../client/src/lib/poemFormatting";

describe("poem formatting", () => {
  it("adds automatic text indentation to every logical poem line", () => {
    const lines = formatPoemLines("첫 행\n둘째 행\n셋째 행");
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([1, 1, 1]);
    expect(getDisplayIndentStyle(lines[0])).toEqual({ textIndent: "1em" });
  });

  it("keeps gaps and standalone markers without automatic indentation", () => {
    const lines = formatPoemLines("첫 행\n\n＜\n다음 행");
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([1, 0, 0, 1]);
    expect(lines[1]).toMatchObject({ kind: "gap", autoIndent: 0 });
    expect(lines[2]).toMatchObject({ kind: "marker", text: "＜", autoIndent: 0 });
  });

  it("preserves explicit full-width and legacy indentation", () => {
    const lines = formatPoemLines("　명시적 첫 행\n둘째 행\n\n  기존 첫 행\n  기존 둘째 행");
    expect(lines[0]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
    expect(getDisplayIndentStyle(lines[0])).toEqual({ paddingLeft: "1em" });
    expect(lines[1]).toMatchObject({ explicitIndent: 0, autoIndent: 1 });
    expect(lines[3]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
    expect(lines[4]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
  });

  it("applies indentation to every selected line", () => {
    const content = "첫 행\n둘째 행\n셋째 행";
    const result = indentSelectedLines(content, 0, content.length, "in");
    expect(result).toBe("　첫 행\n　둘째 행\n　셋째 행");
  });
});
