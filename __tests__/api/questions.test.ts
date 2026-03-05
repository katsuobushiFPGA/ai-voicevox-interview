import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/questions/route";
import { NextRequest } from "next/server";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

describe("GET /api/questions", () => {
  it("デフォルト質問数（5問）が返される", async () => {
    const res = await GET(createRequest("/api/questions"));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.questions).toHaveLength(5);
  });

  it("count=7 で7問返される", async () => {
    const res = await GET(createRequest("/api/questions?count=7"));
    const data = await res.json();
    expect(data.questions).toHaveLength(7);
  });

  it("count が最小値未満の場合クランプ（count=1 → 3問）", async () => {
    const res = await GET(createRequest("/api/questions?count=1"));
    const data = await res.json();
    expect(data.questions).toHaveLength(3);
  });

  it("count が最大値超過の場合クランプ（count=20 → 10問）", async () => {
    const res = await GET(createRequest("/api/questions?count=20"));
    const data = await res.json();
    expect(data.questions).toHaveLength(10);
  });

  it("count が非数値の場合デフォルト（count=abc → 5問）", async () => {
    const res = await GET(createRequest("/api/questions?count=abc"));
    const data = await res.json();
    expect(data.questions).toHaveLength(5);
  });

  it("count が負数の場合クランプ（count=-5 → 3問）", async () => {
    const res = await GET(createRequest("/api/questions?count=-5"));
    const data = await res.json();
    expect(data.questions).toHaveLength(3);
  });

  it("count が小数の場合切り捨て（count=5.7 → 5問）", async () => {
    const res = await GET(createRequest("/api/questions?count=5.7"));
    const data = await res.json();
    expect(data.questions).toHaveLength(5);
  });

  it("レスポンス形式が { questions: Question[] } である", async () => {
    const res = await GET(createRequest("/api/questions?count=3"));
    const data = await res.json();
    expect(data).toHaveProperty("questions");
    expect(Array.isArray(data.questions)).toBe(true);
    for (const q of data.questions) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("category");
      expect(q).toHaveProperty("text");
      expect(q).toHaveProperty("zundamonText");
    }
  });
});
