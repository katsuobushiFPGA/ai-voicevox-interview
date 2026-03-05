import { describe, it, expect } from "vitest";
import {
  VOICEVOX_SPEAKER_ID,
  DEFAULT_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  MAX_QUESTION_COUNT,
  SCORE_MAX,
} from "@/lib/constants";

describe("constants", () => {
  it("VOICEVOX_SPEAKER_ID はずんだもん（3）", () => {
    expect(VOICEVOX_SPEAKER_ID).toBe(3);
  });

  it("質問数のデフォルト値は5", () => {
    expect(DEFAULT_QUESTION_COUNT).toBe(5);
  });

  it("質問数の最小値は3", () => {
    expect(MIN_QUESTION_COUNT).toBe(3);
  });

  it("質問数の最大値は10", () => {
    expect(MAX_QUESTION_COUNT).toBe(10);
  });

  it("MIN ≤ DEFAULT ≤ MAX の関係", () => {
    expect(MIN_QUESTION_COUNT).toBeLessThanOrEqual(DEFAULT_QUESTION_COUNT);
    expect(DEFAULT_QUESTION_COUNT).toBeLessThanOrEqual(MAX_QUESTION_COUNT);
  });

  it("SCORE_MAX は10", () => {
    expect(SCORE_MAX).toBe(10);
  });
});
