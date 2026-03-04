"use client";

import React from "react";

interface MicButtonProps {
  isListening: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function MicButton({ isListening, disabled, onClick }: MicButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-300 focus:outline-none focus:ring-4
        ${
          disabled
            ? "bg-gray-300 cursor-not-allowed opacity-50"
            : isListening
              ? "bg-red-500 hover:bg-red-600 focus:ring-red-300 shadow-lg shadow-red-300"
              : "bg-green-500 hover:bg-green-600 focus:ring-green-300 shadow-lg shadow-green-300"
        }
      `}
      aria-label={isListening ? "録音停止" : "録音開始"}
    >
      {/* 録音中のパルスアニメーション */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
          <span className="absolute inset-[-8px] rounded-full border-2 border-red-300 animate-pulse" />
        </>
      )}

      {/* マイクアイコン */}
      <svg
        className="w-8 h-8 text-white relative z-10"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        {isListening ? (
          // 停止アイコン
          <rect x="6" y="6" width="12" height="12" rx="1" />
        ) : (
          // マイクアイコン
          <>
            <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" />
            <path d="M19 11a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V22h2v-2.06A9 9 0 0 0 21 11h-2z" />
          </>
        )}
      </svg>
    </button>
  );
}
