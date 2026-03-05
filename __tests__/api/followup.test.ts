import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/followup/route";
import { NextRequest } from "next/server";

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/followup", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/followup", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("question が未指定で 400 エラー", async () => {
    const res = await POST(createPostRequest({ answer: "テスト回答" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  it("answer が未指定で 400 エラー", async () => {
    const res = await POST(createPostRequest({ question: "テスト質問" }));
    expect(res.status).toBe(400);
  });

  it("正常な深掘り質問が生成される", async () => {
    const followUpResponse = {
      followUpQuestion: "具体的にどのような経験がありますか？",
      zundamonText: "具体的にどんな経験があるのだ？教えてほしいのだ！",
    };

    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ response: JSON.stringify(followUpResponse) }),
        { status: 200 }
      )
    );

    const res = await POST(
      createPostRequest({
        question: "自己紹介をお願いします",
        answer: "エンジニアの田中です",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.followUpQuestion).toBe(followUpResponse.followUpQuestion);
    expect(data.zundamonText).toBe(followUpResponse.zundamonText);
  });

  it("Ollama が不正 JSON を返してもフォールバックで成功する", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ response: "これは JSON ではない" }),
        { status: 200 }
      )
    );

    const res = await POST(
      createPostRequest({
        question: "テスト質問",
        answer: "テスト回答",
      })
    );
    // フォールバックで 200 が返される
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.followUpQuestion).toBeTruthy();
    expect(data.zundamonText).toBeTruthy();
  });

  it("Ollama 接続失敗でもフォールバックで成功する", async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const resPromise = POST(
      createPostRequest({
        question: "テスト質問",
        answer: "テスト回答",
      })
    );

    // リトライの setTimeout を進める
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(10000);
    }

    const res = await resPromise;
    // catchブロックのフォールバックで200が返される
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.followUpQuestion).toBeTruthy();
    expect(data.zundamonText).toBeTruthy();
    vi.useRealTimers();
  });

  it("followUpQuestion が欠落してもデフォルト値で補完される", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          response: JSON.stringify({ zundamonText: "テストなのだ" }),
        }),
        { status: 200 }
      )
    );

    const res = await POST(
      createPostRequest({
        question: "テスト質問",
        answer: "テスト回答",
      })
    );
    const data = await res.json();
    expect(data.followUpQuestion).toBeTruthy();
  });

  it("zundamonText が欠落してもデフォルト値で補完される", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          response: JSON.stringify({ followUpQuestion: "テスト" }),
        }),
        { status: 200 }
      )
    );

    const res = await POST(
      createPostRequest({
        question: "テスト質問",
        answer: "テスト回答",
      })
    );
    const data = await res.json();
    expect(data.zundamonText).toBeTruthy();
  });

  it("Ollama が 502 を返した後リトライで成功する", async () => {
    vi.useFakeTimers();
    const followUpResponse = {
      followUpQuestion: "詳しく教えてください",
      zundamonText: "詳しく教えてほしいのだ！",
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response("error", { status: 502 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ response: JSON.stringify(followUpResponse) }),
          { status: 200 }
        )
      );

    const resPromise = POST(
      createPostRequest({
        question: "テスト質問",
        answer: "テスト回答",
      })
    );

    await vi.advanceTimersByTimeAsync(5000);

    const res = await resPromise;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.followUpQuestion).toBe(followUpResponse.followUpQuestion);
    vi.useRealTimers();
  });
});
