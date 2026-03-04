import { NextRequest, NextResponse } from "next/server";
import { VOICEVOX_SPEAKER_ID } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const baseUrl =
    process.env.VOICEVOX_BASE_URL || "http://localhost:50021";

  try {
    const { text, speaker = VOICEVOX_SPEAKER_ID } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "テキストが指定されていません" },
        { status: 400 }
      );
    }

    // Step 1: audio_query を取得
    const queryRes = await fetch(
      `${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`,
      { method: "POST" }
    );

    if (!queryRes.ok) {
      return NextResponse.json(
        { error: "VOICEVOX audio_query に失敗しました。VOICEVOX Engine が起動しているか確認してください。" },
        { status: 502 }
      );
    }

    const audioQuery = await queryRes.json();

    // Step 2: synthesis でWAVを取得
    const synthRes = await fetch(
      `${baseUrl}/synthesis?speaker=${speaker}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(audioQuery),
      }
    );

    if (!synthRes.ok) {
      return NextResponse.json(
        { error: "VOICEVOX synthesis に失敗しました" },
        { status: 502 }
      );
    }

    const wavBuffer = await synthRes.arrayBuffer();

    return new NextResponse(wavBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      {
        error:
          "VOICEVOX Engine に接続できません。http://localhost:50021 で起動しているか確認してください。",
      },
      { status: 503 }
    );
  }
}
