import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/tts/route";
import { NextRequest } from "next/server";

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest(new URL("/api/tts", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tts", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("テキスト未指定で 400 エラー", async () => {
    const res = await POST(createPostRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("テキスト");
  });

  it("テキストが空文字で 400 エラー", async () => {
    const res = await POST(createPostRequest({ text: "" }));
    expect(res.status).toBe(400);
  });

  it("テキストが文字列以外で 400 エラー", async () => {
    const res = await POST(createPostRequest({ text: 123 }));
    expect(res.status).toBe(400);
  });

  it("正常な音声合成で audio/wav を返す", async () => {
    const mockAudioQuery = { accent_phrases: [] };
    const mockWavBuffer = new ArrayBuffer(44);

    global.fetch = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockAudioQuery), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(mockWavBuffer, { status: 200 })
      );

    const res = await POST(createPostRequest({ text: "テストなのだ" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/wav");
  });

  it("audio_query 失敗で 502 エラー", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response("error", { status: 500 })
    );

    const res = await POST(createPostRequest({ text: "テスト" }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain("audio_query");
  });

  it("synthesis 失敗で 502 エラー", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ accent_phrases: [] }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response("error", { status: 500 })
      );

    const res = await POST(createPostRequest({ text: "テスト" }));
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain("synthesis");
  });

  it("VOICEVOX 接続不能で 503 エラー", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const res = await POST(createPostRequest({ text: "テスト" }));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("接続");
  });

  it("カスタム speaker ID が使用される", async () => {
    const mockAudioQuery = { accent_phrases: [] };
    const mockWavBuffer = new ArrayBuffer(44);

    global.fetch = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockAudioQuery), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(mockWavBuffer, { status: 200 })
      );

    await POST(createPostRequest({ text: "テスト", speaker: 1 }));

    const firstCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(firstCall[0]).toContain("speaker=1");
  });
});
