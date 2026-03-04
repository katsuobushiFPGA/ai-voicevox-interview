import { NextRequest, NextResponse } from "next/server";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      if (
        (res.status === 503 || res.status === 502 || res.status === 404) &&
        attempt < retries
      ) {
        console.warn(
          `[followup] Ollama returned ${res.status}, retrying (${attempt}/${retries})...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      return res;
    } catch (error) {
      if (attempt < retries) {
        console.warn(
          `[followup] Ollama fetch failed, retrying (${attempt}/${retries})...`,
          error
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(request: NextRequest) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma3:4b";

  console.log(`[followup] Using Ollama at: ${baseUrl}, model: ${model}`);

  try {
    const { question, answer } = (await request.json()) as {
      question: string;
      answer: string;
    };

    if (!question || !answer) {
      return NextResponse.json(
        { error: "質問または回答が不正です" },
        { status: 400 }
      );
    }

    const prompt = buildFollowUpPrompt(question, answer);

    const ollamaRes = await fetchWithRetry(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.5,
          num_predict: 256,
        },
      }),
    });

    if (!ollamaRes.ok) {
      console.error("[followup] Ollama error:", await ollamaRes.text());
      return NextResponse.json(
        { error: "深掘り質問の生成に失敗しました" },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaRes.json();
    const responseText = ollamaData.response;

    let parsed: { followUpQuestion?: string; zundamonText?: string };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error("[followup] Ollama response parse error:", responseText);
      // パースに失敗した場合はデフォルトの深掘り質問を返す
      return NextResponse.json({
        followUpQuestion: "もう少し詳しく教えてください。具体的なエピソードはありますか？",
        zundamonText: "もう少し詳しく教えてほしいのだ！具体的なエピソードがあったら聞きたいのだ！",
      });
    }

    return NextResponse.json({
      followUpQuestion:
        parsed.followUpQuestion ||
        "もう少し詳しく教えてください。",
      zundamonText:
        parsed.zundamonText ||
        "もう少し詳しく教えてほしいのだ！",
    });
  } catch (error) {
    console.error("[followup] API error:", error);
    // エラー時もフォールバックで深掘り質問を返す
    return NextResponse.json({
      followUpQuestion: "もう少し具体的に教えてください。",
      zundamonText: "もう少し具体的に教えてほしいのだ！",
    });
  }
}

function buildFollowUpPrompt(question: string, answer: string): string {
  return `あなたはエンジニア採用面接の面接官です。以下の質問と候補者の回答を読み、回答を深掘りするための追加質問を1つ生成してください。

元の質問: ${question}
候補者の回答: ${answer}

以下の観点で深掘りしてください:
- 回答が抽象的な場合：具体的なエピソードや数字を聞く
- 経験に基づく回答の場合：その時の状況、課題、行動、結果（STAR）を掘り下げる
- 技術的な回答の場合：なぜその技術を選んだか、トレードオフは何か
- キャリアやビジョンの回答の場合：その考えに至った背景やきっかけ

以下の JSON 形式で回答してください。他のテキストは含めないでください。
{
  "followUpQuestion": "深掘り質問（日本語、丁寧語）",
  "zundamonText": "同じ質問をずんだもん口調で（「〜なのだ」「〜のだ」「〜してほしいのだ」という語尾を使う）"
}`;
}
