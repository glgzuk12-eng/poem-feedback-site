import { describe, expect, it } from "vitest";
import { analyzePoem, visualWidth } from "../shared/poemLayout";

describe("automatic poem layout analysis", () => {
  it("measures Korean and Latin glyphs by visual width", () => {
    expect(visualWidth("가A  ")).toBe(2.5);
  });

  it("classifies Seo-si as STANDARD and preserves stanzas", () => {
    const layout = analyzePoem(
      "죽는 날까지 하늘을 우러러\n한 점 부끄럼이 없기를,\n잎새에 이는 바람에도\n나는 괴로워했다.\n\n오늘 밤에도 별이 바람에 스치운다.",
    );
    expect(layout.profile).toBe("STANDARD");
    expect(layout.stanzas).toHaveLength(2);
    expect(layout.stanzas[0].lines).toHaveLength(4);
    expect(layout.turnover).toBe(1.4);
  });

  it("classifies long lines as LONG and enables turnover", () => {
    const layout = analyzePoem(
      "님은 갔습니다. 아아, 사랑하는 나의 님은 갔습니다.\n푸른 산빛을 깨치고 단풍나무 숲을 향하여 난 작은 길을 걸어서, 차마 떨치고 갔습니다.",
    );
    expect(layout.profile).toBe("LONG");
    expect(layout.turnover).toBeGreaterThanOrEqual(2);
    expect(layout.measure).toBeLessThanOrEqual(36);
  });

  it("classifies a stepped arrangement as SHAPED", () => {
    const layout = analyzePoem("나는\n    걸었다\n        아무도\n            없는");
    expect(layout.profile).toBe("SHAPED");
    expect(layout.turnover).toBe(0);
    expect(layout.stanzas[0].lines.map((line) => line.indent)).toEqual([0, 2, 4, 6]);
  });

  it("preserves a long unbroken token through the overflow flag", () => {
    const layout = analyzePoem("가나다라마바사아자차카타파하가나다라마바사아자차카타파하");
    expect(layout.overflowWrapAnywhere).toBe(true);
  });
});
