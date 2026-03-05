import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/evaluate/route";
import { NextRequest } from "next/server";
import { SCORE_MAX } from "@/lib/constants";

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/evaluate", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validAnswers = [
  { questionId: 1, question: "自己紹介をお願いします", transcript: "エンジニアの田中です" },
  { questionId: 2, question: "転職理由を教えてください", transcript: "スキルアップのためです" },
];

function makeOllamaResponse(overrides: Record<string, unknown> = {}) {
  return {
    scores: [
      { questionId: 1, score: 7, feedback: "良い自己紹介です" },
      { questionId: 2, score: 6, feedback: "具体性があると良い" },
    ],
    totalScore: 13,
    overallFeedback: "全体的に良い面接でした",
    zundamonComment: "いい面接だったのだ！",
    ...overrides,
  };
}

describe("POST /api/evaluate", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("answers が空配列で 400 エラー", async () => {
    const res = await POST(createPostRequest({ answers: [] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("不正");
  });

  it("answers が未定義で 400 エラー", async () => {
    const res = await POST(createPostRequest({}));
    expect(res.status).toBe(400);
  });

  it("answers が配列でない場合 400 エラー", async () => {
    const res = await POST(createPostRequest({ answers: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("正常な評価リクエストが成功する", async () => {
    const ollamaResponse = makeOllamaResponse();

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("scores");
    expect(data).toHaveProperty("totalScore");
    expect(data).toHaveProperty("maxTotalScore");
    expect(data).toHaveProperty("overallFeedback");
    expect(data).toHaveProperty("zundamonComment");
  });

  it("maxTotalScore が answers.length × SCORE_MAX", async () => {
    const ollamaResponse = makeOllamaResponse();

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    expect(data.maxTotalScore).toBe(validAnswers.length * SCORE_MAX);
  });

  it("スコアが SCORE_MAX を超える場合クランプされる", async () => {
    const ollamaResponse = makeOllamaResponse({
      scores: [
        { questionId: 1, score: 15, feedback: "test" },
        { questionId: 2, score: 6, feedback: "test" },
      ],
    });

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    expect(data.scores[0].score).toBe(SCORE_MAX);
  });

  it("スコアが 0 以下の場合 1 にクランプされる", async () => {
    const ollamaResponse = makeOllamaResponse({
      scores: [
        { questionId: 1, score: -1, feedback: "test" },
        { questionId: 2, score: 0, feedback: "test" },
      ],
    });

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    expect(data.scores[0].score).toBe(1);
    expect(data.scores[1].score).toBe(1);
  });

  it("スコアが非数値の場合デフォルト 1", async () => {
    const ollamaResponse = makeOllamaResponse({
      scores: [
        { questionId: 1, score: "abc", feedback: "test" },
        { questionId: 2, score: null, feedback: "test" },
      ],
    });

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    expect(data.scores[0].score).toBe(1);
    expect(data.scores[1].score).toBe(1);
  });

  it("overallFeedback が未定義の場合デフォルトメッセージ", async () => {
    const ollamaResponse = makeOllamaResponse({ overallFeedback: undefined });

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    expect(data.overallFeedback).toBeTruthy();
  });

  it("zundamonComment が未定義の場合デフォルトメッセージ", async () => {
    const ollamaResponse = makeOllamaResponse({ zundamonComment: undefined });

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    expect(data.zundamonComment).toBeTruthy();
  });

  it("Ollama が不正 JSON を返すと 500 エラー", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: "not valid json" }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("パース");
  });

  it("Ollama 接続不能で 503 エラー", async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const resPromise = POST(createPostRequest({ answers: validAnswers }));

    // リトライの setTimeout を進める
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(10000);
    }

    const res = await resPromise;
    expect(res.status).toBe(503);
    vi.useRealTimers();
  });

  it("scores が空の場合デフォルトスコアが生成される", async () => {
    const ollamaResponse = makeOllamaResponse({ scores: [] });

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    // scores が空でも answers の数だけスコアが生成される
    expect(data.scores).toHaveLength(validAnswers.length);
    // デフォルトスコアは 1
    expect(data.scores[0].score).toBe(1);
  });

  it("totalScore が各スコアの合計となる", async () => {
    const ollamaResponse = makeOllamaResponse({
      scores: [
        { questionId: 1, score: 7, feedback: "good" },
        { questionId: 2, score: 8, feedback: "great" },
      ],
    });

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ response: JSON.stringify(ollamaResponse) }), {
        status: 200,
      })
    );

    const res = await POST(createPostRequest({ answers: validAnswers }));
    const data = await res.json();
    const expectedTotal = data.scores.reduce(
      (sum: number, s: { score: number }) => sum + s.score,
      0
    );
    expect(data.totalScore).toBe(expectedTotal);
  });
});
