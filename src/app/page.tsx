"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ZundamonAvatar } from "@/components/ZundamonAvatar";
import {
  DEFAULT_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  MAX_QUESTION_COUNT,
} from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);

  const handleStart = () => {
    router.push(`/interview?count=${questionCount}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* ヘッダー */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-green-800">
            ずんだもん面接
          </h1>
          <p className="text-green-600 text-lg">
            AIエンジニア採用面接シミュレーター
          </p>
        </div>

        {/* ずんだもんアバター */}
        <div className="flex justify-center">
          <ZundamonAvatar size="lg" state="idle" />
        </div>

        {/* 説明 */}
        <div className="bg-white rounded-2xl border-2 border-green-200 p-6 shadow-sm space-y-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            ずんだもんが面接官として技術面接を行うのだ！
            <br />
            マイクを使って音声で回答してほしいのだ！
            <br />
            全ての質問が終わったら評価結果を表示するのだ！
          </p>

          <div className="border-t border-green-100 pt-4">
            <p className="text-sm text-gray-500 mb-1">必要なもの</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>✅ マイク（音声入力用）</li>
              <li>
                ✅ VOICEVOX Engine（
                <code className="bg-gray-100 px-1 rounded">localhost:50021</code>
                ）
              </li>
              <li>
                ✅ Ollama（
                <code className="bg-gray-100 px-1 rounded">localhost:11434</code>
                ）
              </li>
              <li>✅ Chrome / Edge ブラウザ</li>
            </ul>
          </div>
        </div>

        {/* 質問数設定 */}
        <div className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            質問数:{" "}
            <span className="text-green-600 font-bold text-lg">
              {questionCount}
            </span>{" "}
            問
          </label>
          <input
            type="range"
            min={MIN_QUESTION_COUNT}
            max={MAX_QUESTION_COUNT}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{MIN_QUESTION_COUNT}</span>
            <span>{MAX_QUESTION_COUNT}</span>
          </div>
        </div>

        {/* 開始ボタン */}
        <button
          onClick={handleStart}
          className="w-full py-4 px-8 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:from-green-600 hover:to-green-700 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          面接を始めるのだ！
        </button>

        <p className="text-xs text-gray-400">
          ※ VOICEVOX と Ollama が起動していることをご確認ください
        </p>
      </div>
    </div>
  );
}
