"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ZundamonAvatar } from "@/components/ZundamonAvatar";
import { SpeechBubble } from "@/components/SpeechBubble";
import { ScoreCard } from "@/components/ScoreCard";
import { useVoicebox } from "@/hooks/useVoicebox";
import { EvaluationResult } from "@/types";
import { SCORE_MAX } from "@/lib/constants";

export default function ResultPage() {
  const router = useRouter();
  const voicebox = useVoicebox();
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const hasSpokenRef = useRef(false);

  // sessionStorage から評価結果を取得
  useEffect(() => {
    const stored = sessionStorage.getItem("interviewResult");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as EvaluationResult;
        setEvaluation(parsed);
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  // 結果読み上げ
  useEffect(() => {
    if (evaluation && !hasSpokenRef.current) {
      hasSpokenRef.current = true;
      const speak = async () => {
        try {
          await voicebox.speak(
            evaluation.zundamonComment ||
              "お疲れ様なのだ！結果を表示するのだ！"
          );
        } catch {
          // VOICEVOX エラーは無視
        }
        setShowDetails(true);
      };
      speak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation]);

  const handleRetry = () => {
    sessionStorage.removeItem("interviewResult");
    router.push("/");
  };

  if (!evaluation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const percentage = Math.round(
    (evaluation.totalScore / evaluation.maxTotalScore) * 100
  );

  const gradeInfo = (() => {
    if (percentage >= 90) return { grade: "S", color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-300" };
    if (percentage >= 80) return { grade: "A", color: "text-green-600", bg: "bg-green-50", border: "border-green-300" };
    if (percentage >= 60) return { grade: "B", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-300" };
    if (percentage >= 40) return { grade: "C", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-300" };
    return { grade: "D", color: "text-red-600", bg: "bg-red-50", border: "border-red-300" };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-green-800">面接結果</h1>
          <button
            onClick={handleRetry}
            className="text-sm text-green-600 hover:text-green-800 font-medium"
          >
            トップに戻る
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        {/* ずんだもんの総評 */}
        <div className="flex flex-col items-center space-y-4">
          <ZundamonAvatar
            size="md"
            state={voicebox.isSpeaking ? "speaking" : "idle"}
          />
          <SpeechBubble
            text={evaluation.zundamonComment}
            variant="zundamon"
          />
        </div>

        {/* 総合スコア */}
        <div
          className={`${gradeInfo.bg} border-2 ${gradeInfo.border} rounded-2xl p-8 text-center`}
        >
          <p className="text-sm text-gray-500 mb-2">総合評価</p>
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-6xl font-black ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </span>
            <div className="text-left">
              <p className="text-3xl font-bold text-gray-800">
                {evaluation.totalScore}
                <span className="text-lg text-gray-400">
                  {" "}
                  / {evaluation.maxTotalScore}
                </span>
              </p>
              <p className="text-sm text-gray-500">{percentage}% 正解率</p>
            </div>
          </div>

          {/* スコアバー */}
          <div className="mt-4 w-full h-4 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: showDetails ? `${percentage}%` : "0%" }}
            />
          </div>
        </div>

        {/* 総合フィードバック */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            📝 総合フィードバック
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {evaluation.overallFeedback}
          </p>
        </div>

        {/* 各質問のスコア */}
        {showDetails && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">
              📊 質問別スコア
            </h2>
            {evaluation.scores.map((score, index) => (
              <ScoreCard key={score.questionId} score={score} index={index} />
            ))}
          </div>
        )}

        {/* スコア分布（簡易棒グラフ） */}
        {showDetails && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              📈 スコア分布
            </h2>
            <div className="space-y-3">
              {evaluation.scores.map((score, index) => (
                <div key={score.questionId} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8 text-right">
                    Q{index + 1}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        score.score >= 8
                          ? "bg-green-500"
                          : score.score >= 5
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${(score.score / SCORE_MAX) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-12">
                    {score.score}/{SCORE_MAX}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* もう一度ボタン */}
        <div className="text-center pb-8">
          <button
            onClick={handleRetry}
            className="py-4 px-8 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:from-green-600 hover:to-green-700 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
          >
            もう一度面接するのだ！
          </button>
        </div>
      </main>
    </div>
  );
}
