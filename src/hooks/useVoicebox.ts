"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface VoiceboxHook {
  speak: (text: string) => Promise<void>;
  isSpeaking: boolean;
  error: string | null;
}

export function useVoicebox(): VoiceboxHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      cleanup();
      setError(null);
      setIsSpeaking(true);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err.error || "音声合成に失敗しました"
          );
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        return new Promise<void>((resolve, reject) => {
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            cleanup();
            resolve();
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            cleanup();
            reject(new Error("音声の再生に失敗しました"));
          };

          audio.play().catch((e) => {
            setIsSpeaking(false);
            cleanup();
            reject(e);
          });
        });
      } catch (e) {
        setIsSpeaking(false);
        const message =
          e instanceof Error ? e.message : "音声合成でエラーが発生しました";
        setError(message);
        throw e;
      }
    },
    [cleanup]
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { speak, isSpeaking, error };
}
