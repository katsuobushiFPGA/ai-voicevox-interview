import { NextRequest, NextResponse } from "next/server";
import { Answer, EvaluationResult, QuestionScore } from "@/types";
import { SCORE_MAX } from "@/lib/constants";

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

      // 502/503/404 はリトライ対象（404 はモデル未ダウンロード時）
      if ((res.status === 503 || res.status === 502 || res.status === 404) && attempt < retries) {
        console.warn(
          `Ollama returned ${res.status}, retrying (${attempt}/${retries})...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      return res;
    } catch (error) {
      if (attempt < retries) {
        console.warn(
          `Ollama fetch failed, retrying (${attempt}/${retries})...`,
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
  const baseUrl =
    process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma2";

  console.log(`[evaluate] Using Ollama at: ${baseUrl}, model: ${model}`);

  try {
    const { answers } = (await request.json()) as { answers: Answer[] };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "回答データが不正です" },
        { status: 400 }
      );
    }

    const prompt = buildEvaluationPrompt(answers);

    const ollamaRes = await fetchWithRetry(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.3,
          num_predict: 2048,
        },
      }),
    });

    if (!ollamaRes.ok) {
      console.error("Ollama error:", await ollamaRes.text());
      return NextResponse.json(
        {
          error: `Ollama に接続できません。${baseUrl} で起動しているか確認してください。また、モデル "${model}" がダウンロード済みか確認してください。`,
        },
        { status: 502 }
      );
    }

    const ollamaData = await ollamaRes.json();
    const responseText = ollamaData.response;

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error("Ollama response parse error:", responseText);
      return NextResponse.json(
        { error: "評価結果のパースに失敗しました" },
        { status: 500 }
      );
    }

    const evaluation = formatEvaluation(parsed, answers);

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Evaluate API error:", error);
    return NextResponse.json(
      {
        error: `評価処理でエラーが発生しました。Ollama (${baseUrl}) が起動しているか、モデル "${model}" がダウンロード済みか確認してください。`,
      },
      { status: 503 }
    );
  }
}

function buildEvaluationPrompt(answers: Answer[]): string {
  const questionsText = answers
    .map(
      (a, i) =>
        `質問${i + 1}: ${a.question}\n回答${i + 1}: ${a.transcript || "（無回答）"}`
    )
    .join("\n\n");

  return `あなたはエンジニア採用面接の評価者です。以下の面接の質問と回答を評価してください。

${questionsText}

以下の JSON 形式で回答してください。他のテキストは含めないでください。
{
  "scores": [
    {
      "questionId": 質問番号（1から始まる整数）,
      "score": 1〜${SCORE_MAX}の整数で評価,
      "feedback": "この回答に対する具体的なフィードバック（日本語で50〜100文字程度）"
    }
  ],
  "totalScore": 全質問のスコア合計,
  "overallFeedback": "全体的な評価コメント（日本語で100〜200文字程度。改善点や良かった点を具体的に）",
  "zundamonComment": "ずんだもん口調での総評（「〜なのだ」「〜のだ」という語尾を使う。100文字程度）"
}

評価基準:
- 質問への的確さ（質問に対して適切に答えているか）
- 具体性（具体的な経験や技術名を挙げているか）
- 論理性（回答が論理的に構成されているか）
- コミュニケーション力（わかりやすく説明できているか）
- 無回答や短すぎる回答は低得点`;
}

function formatEvaluation(
  parsed: Record<string, unknown>,
  answers: Answer[]
): EvaluationResult {
  const rawScores = (parsed.scores as Array<Record<string, unknown>>) || [];

  const scores: QuestionScore[] = answers.map((answer, i) => {
    const rawScore = rawScores.find(
      (s) => Number(s.questionId) === i + 1
    );

    return {
      questionId: answer.questionId,
      category: answer.question,
      question: answer.question,
      answer: answer.transcript || "（無回答）",
      score: Math.min(
        SCORE_MAX,
        Math.max(1, Number(rawScore?.score) || 1)
      ),
      feedback:
        (rawScore?.feedback as string) || "評価を取得できませんでした。",
    };
  });

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxTotalScore = answers.length * SCORE_MAX;

  return {
    scores,
    totalScore,
    maxTotalScore,
    overallFeedback:
      (parsed.overallFeedback as string) ||
      "全体的な評価を取得できませんでした。",
    zundamonComment:
      (parsed.zundamonComment as string) ||
      "面接お疲れ様なのだ！結果をよく見てほしいのだ！",
  };
}
