"use client";

import React from "react";

interface SpeechBubbleProps {
  text: string;
  variant?: "zundamon" | "user";
}

export function SpeechBubble({ text, variant = "zundamon" }: SpeechBubbleProps) {
  const isZundamon = variant === "zundamon";

  return (
    <div
      className={`relative max-w-lg px-6 py-4 rounded-2xl shadow-md ${
        isZundamon
          ? "bg-green-50 border-2 border-green-300 text-green-900"
          : "bg-blue-50 border-2 border-blue-300 text-blue-900"
      }`}
    >
      {/* 吹き出しの三角形 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${
          isZundamon
            ? "left-[-12px] border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-r-[12px] border-r-green-300"
            : "right-[-12px] border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[12px] border-l-blue-300"
        }`}
      />
      <p className="text-base leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
