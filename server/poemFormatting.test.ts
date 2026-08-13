import { describe, expect, it } from "vitest";
import {
  formatPoemLines,
  getDisplayIndentStyle,
  getEffectiveIndent,
  indentSelectedLines,
} from "../client/src/lib/poemFormatting";

describe("poem formatting", () => {
  it("keeps every Enter-separated line independent without automatic indentation", () => {
    const lines = formatPoemLines("첫 행\n둘째 행\n셋째 행");
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([0, 0, 0]);
    expect(lines.map((line) => line.text)).toEqual(["첫 행", "둘째 행", "셋째 행"]);
    expect(getDisplayIndentStyle(lines[0])).toBeUndefined();
  });

  it("keeps blank lines and standalone stanza markers visible as separate entries", () => {
    const lines = formatPoemLines("첫 행\n\n＜\n다음 행");
    expect(lines.map((line) => line.kind)).toEqual(["line", "gap", "marker", "line"]);
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([0, 0, 0, 0]);
    expect(lines[2]).toMatchObject({ text: "＜", autoIndent: 0 });
  });

  it("preserves explicit full-width and legacy indentation only when present in the source", () => {
    const lines = formatPoemLines("　명시적 첫 행\n둘째 행\n\n  기존 첫 행\n  기존 둘째 행");
    expect(lines[0]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
    expect(getDisplayIndentStyle(lines[0])).toEqual({ paddingLeft: "1em" });
    expect(lines[1]).toMatchObject({ explicitIndent: 0, autoIndent: 0 });
    expect(lines[3]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
    expect(lines[4]).toMatchObject({ explicitIndent: 1, autoIndent: 0 });
  });

  it("keeps explicit indentation controls available for selected lines", () => {
    const content = "첫 행\n둘째 행\n셋째 행";
    const result = indentSelectedLines(content, 0, content.length, "in");
    expect(result).toBe("　첫 행\n　둘째 행\n　셋째 행");
  });
});
