import { NextRequest, NextResponse } from "next/server";
import { selectQuestions } from "@/data/questions";
import {
  DEFAULT_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  MAX_QUESTION_COUNT,
} from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countParam = searchParams.get("count");

  let count = DEFAULT_QUESTION_COUNT;
  if (countParam) {
    const parsed = parseInt(countParam, 10);
    if (!isNaN(parsed)) {
      count = Math.max(MIN_QUESTION_COUNT, Math.min(MAX_QUESTION_COUNT, parsed));
    }
  }

  const questions = selectQuestions(count);

  return NextResponse.json({ questions });
}
