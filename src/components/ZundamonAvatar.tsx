"use client";

import React from "react";
import Image from "next/image";

interface ZundamonAvatarProps {
  state?: "idle" | "speaking" | "listening" | "thinking";
  size?: "sm" | "md" | "lg";
}

const IMAGE_MAP: Record<string, string> = {
  idle: "/zundamon/idle.png",
  speaking: "/zundamon/speaking.png",
  listening: "/zundamon/listening.png",
  thinking: "/zundamon/thinking.png",
};

export function ZundamonAvatar({
  state = "idle",
  size = "md",
}: ZundamonAvatarProps) {
  const sizeConfig = {
    sm: { container: "w-24 h-40", width: 96, height: 160 },
    md: { container: "w-40 h-64", width: 160, height: 256 },
    lg: { container: "w-56 h-96", width: 224, height: 384 },
  };

  const borderAnimation = {
    idle: "",
    speaking: "animate-pulse ring-4 ring-green-400",
    listening: "ring-4 ring-blue-400 animate-pulse",
    thinking: "ring-4 ring-yellow-400 animate-spin-slow",
  };

  const cfg = sizeConfig[size];

  return (
    <div
      className={`${cfg.container} rounded-2xl ${borderAnimation[state]} transition-all duration-300 flex items-center justify-center overflow-hidden shadow-lg relative`}
    >
      <Image
        src={IMAGE_MAP[state]}
        alt={`ずんだもん - ${state}`}
        width={cfg.width}
        height={cfg.height}
        className="object-contain w-full h-full drop-shadow-md"
        priority
        unoptimized
      />
    </div>
  );
}
