import { describe, it, expect } from "vitest";
import { selectQuestions, questionPool } from "@/data/questions";

describe("questionPool", () => {
  it("全27問が存在する", () => {
    expect(questionPool).toHaveLength(27);
  });

  it("各質問に必須フィールドが存在する", () => {
    for (const q of questionPool) {
      expect(q.id).toBeGreaterThan(0);
      expect(q.category).toBeTruthy();
      expect(q.text).toBeTruthy();
      expect(q.zundamonText).toBeTruthy();
    }
  });

  it("質問IDがユニークである", () => {
    const ids = questionPool.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("8カテゴリすべてが含まれる", () => {
    const categories = new Set(questionPool.map((q) => q.category));
    expect(categories.size).toBe(8);
    expect(categories).toContain("self-introduction");
    expect(categories).toContain("career-change");
    expect(categories).toContain("motivation");
    expect(categories).toContain("career-plan");
    expect(categories).toContain("experience");
    expect(categories).toContain("strengths");
    expect(categories).toContain("technical");
    expect(categories).toContain("reverse");
  });
});

describe("selectQuestions", () => {
  it("指定数の質問が返される (count=5)", () => {
    const result = selectQuestions(5);
    expect(result).toHaveLength(5);
  });

  it("最小数で質問が返される (count=3)", () => {
    const result = selectQuestions(3);
    expect(result).toHaveLength(3);
  });

  it("最大数で質問が返される (count=10)", () => {
    const result = selectQuestions(10);
    expect(result).toHaveLength(10);
  });

  it("カテゴリバランスが保たれる (count=8)", () => {
    const result = selectQuestions(8);
    const categories = result.map((q) => q.category);
    const uniqueCategories = new Set(categories);
    // 8カテゴリから各1問ずつ選ばれるはず
    expect(uniqueCategories.size).toBe(8);
  });

  it("全質問数以上を要求しても枯渇で停止する", () => {
    const result = selectQuestions(100);
    expect(result).toHaveLength(27);
  });

  it("重複する質問IDが含まれない", () => {
    const result = selectQuestions(10);
    const ids = result.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("各質問に必須フィールドが存在する", () => {
    const result = selectQuestions(5);
    for (const q of result) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("category");
      expect(q).toHaveProperty("text");
      expect(q).toHaveProperty("zundamonText");
    }
  });

  it("呼び出すたびに順序が変わる可能性がある（シャッフル）", () => {
    // 確率的テスト: 10回実行して少なくとも1回は異なる順序になることを確認
    const results = Array.from({ length: 10 }, () =>
      selectQuestions(5).map((q) => q.id)
    );
    const firstResult = JSON.stringify(results[0]);
    const hasDifferentOrder = results.some(
      (r) => JSON.stringify(r) !== firstResult
    );
    expect(hasDifferentOrder).toBe(true);
  });

  it("count=1 でも1問返される", () => {
    const result = selectQuestions(1);
    expect(result).toHaveLength(1);
  });

  it("count=0 で空配列が返される", () => {
    const result = selectQuestions(0);
    expect(result).toHaveLength(0);
  });
});
