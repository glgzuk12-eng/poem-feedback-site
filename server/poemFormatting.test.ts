import { describe, expect, it } from "vitest";
import {
  formatPoemLines,
  getDisplayIndentStyle,
  getEffectiveIndent,
  indentSelectedLines,
} from "../client/src/lib/poemFormatting";

describe("poem formatting", () => {
  it("preserves every Enter-separated line and its source spaces", () => {
    const lines = formatPoemLines("첫 행\n  두 칸 행\n    네 칸 행\n　전각 공백 행");
    expect(lines.map((line) => line.kind)).toEqual(["line", "line", "line", "line"]);
    expect(lines.map((line) => line.text)).toEqual(["첫 행", "  두 칸 행", "    네 칸 행", "　전각 공백 행"]);
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([0, 0, 0, 0]);
    expect(lines.every((line) => getDisplayIndentStyle(line) === undefined)).toBe(true);
  });

  it("keeps blank lines and standalone markers as separate entries", () => {
    const lines = formatPoemLines("첫 행\n\n ＜\n다음 행");
    expect(lines.map((line) => line.kind)).toEqual(["line", "gap", "marker", "line"]);
    expect(lines.map((line) => line.text)).toEqual(["첫 행", "", " ＜", "다음 행"]);
    expect(lines.map((line) => getEffectiveIndent(line))).toEqual([0, 0, 0, 0]);
  });

  it("does not normalize spaces in mixed content", () => {
    const content = "앞  중간   공백\n끝 공백  \n  시작 공백";
    const lines = formatPoemLines(content);
    expect(lines.map((line) => line.text)).toEqual(["앞  중간   공백", "끝 공백  ", "  시작 공백"]);
  });

  it("keeps explicit indentation controls available for selected lines", () => {
    const content = "첫 행\n둘째 행\n셋째 행";
    const indented = indentSelectedLines(content, 0, content.length, "in");
    expect(indented).toBe("　첫 행\n　둘째 행\n　셋째 행");
    expect(indentSelectedLines(indented, 0, indented.length, "out")).toBe(content);
  });
});
