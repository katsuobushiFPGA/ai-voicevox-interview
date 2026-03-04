"use client";

import React from "react";
import { QuestionScore } from "@/types";
import { SCORE_MAX } from "@/lib/constants";

interface ScoreCardProps {
  score: QuestionScore;
  index: number;
}

export function ScoreCard({ score, index }: ScoreCardProps) {
  const percentage = (score.score / SCORE_MAX) * 100;

  const scoreColor =
    score.score >= 8
      ? "text-green-600"
      : score.score >= 5
        ? "text-yellow-600"
        : "text-red-600";

  const barColor =
    score.score >= 8
      ? "from-green-400 to-green-600"
      : score.score >= 5
        ? "from-yellow-400 to-yellow-600"
        : "from-red-400 to-red-600";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
            質問 {index + 1}
          </span>
          <p className="mt-2 text-sm font-medium text-gray-800">
            {score.question}
          </p>
        </div>
        <div className={`text-2xl font-bold ml-4 ${scoreColor}`}>
          {score.score}
          <span className="text-sm text-gray-400">/{SCORE_MAX}</span>
        </div>
      </div>

      {/* スコアバー */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 回答内容 */}
      <details className="mb-3">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          あなたの回答を見る
        </summary>
        <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          {score.answer}
        </p>
      </details>

      {/* フィードバック */}
      <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
        <span className="font-semibold text-green-700">フィードバック: </span>
        {score.feedback}
      </div>
    </div>
  );
}
