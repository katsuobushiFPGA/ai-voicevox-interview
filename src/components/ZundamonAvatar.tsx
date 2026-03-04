"use client";

import React from "react";

interface ZundamonAvatarProps {
  state?: "idle" | "speaking" | "listening" | "thinking";
  size?: "sm" | "md" | "lg";
}

export function ZundamonAvatar({
  state = "idle",
  size = "md",
}: ZundamonAvatarProps) {
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  const borderAnimation = {
    idle: "",
    speaking: "animate-pulse ring-4 ring-green-400",
    listening: "ring-4 ring-blue-400 animate-pulse",
    thinking: "ring-4 ring-yellow-400 animate-spin-slow",
  };

  // ずんだもんの表情をSVGで表現
  const expression = {
    idle: { mouth: "M 35 65 Q 50 72 65 65", eyes: "open" },
    speaking: { mouth: "M 38 62 Q 50 78 62 62", eyes: "open" },
    listening: { mouth: "M 40 66 Q 50 70 60 66", eyes: "wide" },
    thinking: { mouth: "M 40 68 Q 50 65 60 68", eyes: "closed" },
  };

  const expr = expression[state];

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${borderAnimation[state]} transition-all duration-300 flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-300 to-green-500 shadow-lg`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 顔の背景 */}
        <circle cx="50" cy="50" r="48" fill="#A5D667" />
        <circle cx="50" cy="52" r="40" fill="#F5F0E1" />

        {/* 耳（枝豆モチーフ） */}
        <ellipse cx="15" cy="35" rx="10" ry="15" fill="#7CB342" />
        <ellipse cx="85" cy="35" rx="10" ry="15" fill="#7CB342" />

        {/* 目 */}
        {expr.eyes === "open" && (
          <>
            <ellipse cx="37" cy="45" rx="6" ry="7" fill="#333" />
            <ellipse cx="63" cy="45" rx="6" ry="7" fill="#333" />
            <circle cx="35" cy="43" r="2" fill="white" />
            <circle cx="61" cy="43" r="2" fill="white" />
          </>
        )}
        {expr.eyes === "wide" && (
          <>
            <ellipse cx="37" cy="45" rx="7" ry="8" fill="#333" />
            <ellipse cx="63" cy="45" rx="7" ry="8" fill="#333" />
            <circle cx="35" cy="42" r="2.5" fill="white" />
            <circle cx="61" cy="42" r="2.5" fill="white" />
          </>
        )}
        {expr.eyes === "closed" && (
          <>
            <path
              d="M 30 45 Q 37 50 44 45"
              stroke="#333"
              strokeWidth="2.5"
              fill="none"
            />
            <path
              d="M 56 45 Q 63 50 70 45"
              stroke="#333"
              strokeWidth="2.5"
              fill="none"
            />
          </>
        )}

        {/* ほっぺ */}
        <circle cx="25" cy="55" r="6" fill="#FFB7B7" opacity="0.5" />
        <circle cx="75" cy="55" r="6" fill="#FFB7B7" opacity="0.5" />

        {/* 口 */}
        <path
          d={expr.mouth}
          stroke="#333"
          strokeWidth="2"
          fill={state === "speaking" ? "#FF9999" : "none"}
          strokeLinecap="round"
        />

        {/* 頭の枝豆 */}
        <ellipse cx="50" cy="12" rx="12" ry="8" fill="#7CB342" />
        <ellipse cx="42" cy="12" rx="5" ry="6" fill="#8BC34A" />
        <ellipse cx="58" cy="12" rx="5" ry="6" fill="#8BC34A" />
      </svg>
    </div>
  );
}
