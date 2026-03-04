"use client";

import React, { useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ZundamonAvatar } from "@/components/ZundamonAvatar";
import { MicButton } from "@/components/MicButton";
import { SpeechBubble } from "@/components/SpeechBubble";
import { ProgressBar } from "@/components/ProgressBar";
import { useInterview } from "@/hooks/useInterview";
import { useVoicebox } from "@/hooks/useVoicebox";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { DEFAULT_QUESTION_COUNT } from "@/lib/constants";

function InterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const countParam = searchParams.get("count");
  const deepDiveParam = searchParams.get("deepDive") === "1";
  const questionCount = countParam
    ? parseInt(countParam, 10)
    : DEFAULT_QUESTION_COUNT;

  const interview = useInterview();
  const voicebox = useVoicebox();
  const speech = useSpeechRecognition();

  const hasStartedRef = useRef(false);
  const isProcessingRef = useRef(false);
  // 深掘り済みかどうか（1質問の中で1回だけ深掘りする）
  const hasFollowedUpRef = useRef(false);

  // voicebox.speak を ref 経由で持つ（エフェクト依存を安定させる）
  const speakRef = useRef(voicebox.speak);
  speakRef.current = voicebox.speak;

  const interviewRef = useRef(interview);
  interviewRef.current = interview;

  // 面接開始
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      interview.startInterview(questionCount, deepDiveParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // メインフローオーケストレーション
  // greeting / transitioning / followup フェーズを一箇所で処理し、
  // 次の質問の読み上げもここで直接行う（タイミング問題を回避）
  useEffect(() => {
    if (isProcessingRef.current) return;

    const phase = interview.phase;

    if (
      phase !== "greeting" &&
      phase !== "questioning" &&
      phase !== "transitioning" &&
      phase !== "followup"
    ) {
      return;
    }

    isProcessingRef.current = true;
    console.log(`[interview-flow] Processing phase: ${phase}`);

    const run = async () => {
      const iv = interviewRef.current;
      const speak = speakRef.current;

      try {
        if (phase === "greeting") {
          // 挨拶
          try {
            await speak(
              "こんにちはなのだ！ずんだもんが面接官を務めるのだ！リラックスして答えてほしいのだ！"
            );
          } catch {
            // VOICEVOX エラーは無視
          }

          // 最初の質問を読み上げ
          const q = iv.currentQuestion;
          if (q) {
            hasFollowedUpRef.current = false;
            iv.setPhase("questioning");
            try {
              await speak(q.zundamonText);
            } catch {
              // ignore
            }
          }
          iv.setPhase("listening");

        } else if (phase === "questioning") {
          // 初回以外の質問読み上げ（フォールバック）
          const q = iv.currentQuestion;
          if (q) {
            try {
              await speak(q.zundamonText);
            } catch {
              // ignore
            }
          }
          iv.setPhase("listening");

        } else if (phase === "followup") {
          // 深掘り質問の読み上げ
          const followUpText = iv.state.followUpText;
          if (followUpText) {
            console.log(`[interview-flow] Speaking followup: ${followUpText.substring(0, 40)}...`);
            try {
              await speak(followUpText);
            } catch {
              // ignore
            }
          }
          iv.setPhase("followup-listening");

        } else if (phase === "transitioning") {
          // 回答受付後の遷移
          try {
            await speak("なるほどなのだ！");
          } catch {
            // ignore
          }

          // 深掘りモードON かつ まだ深掘りしていない場合 → 深掘り質問を生成
          if (iv.deepDiveMode && !hasFollowedUpRef.current) {
            hasFollowedUpRef.current = true;
            console.log(`[interview-flow] DeepDive mode: generating followup question`);
            try {
              await speak("もう少し聞きたいことがあるのだ！");
            } catch {
              // ignore
            }
            try {
              await iv.generateFollowUp();
              // followup フェーズに遷移（↑の generateFollowUp 内で setState される）
              // 次の useEffect トリガーで followup フェーズがハンドルされる
            } catch (e) {
              console.error("[interview-flow] Follow-up generation failed:", e);
              // 深掘り失敗時はスキップして次の質問へ
              await proceedToNextQuestion(iv, speak);
            }
          } else {
            // 深掘り済み or 深掘りモードOFF → 次の質問へ
            await proceedToNextQuestion(iv, speak);
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.phase]);

  /** 次の質問へ進む共通処理 */
  async function proceedToNextQuestion(
    iv: typeof interview,
    speak: typeof voicebox.speak
  ) {
    const { hasMore, question } = iv.nextQuestion();
    console.log(
      `[interview-flow] nextQuestion result: hasMore=${hasMore}, question=${question?.id ?? "null"}`
    );

    if (hasMore && question) {
      hasFollowedUpRef.current = false;
      console.log(
        `[interview-flow] Speaking next question: ${question.zundamonText.substring(0, 30)}...`
      );
      try {
        await speak(question.zundamonText);
      } catch {
        // ignore
      }
      iv.setPhase("listening");
    } else {
      console.log(`[interview-flow] All questions done, starting evaluation`);
      try {
        await speak(
          "全ての質問が終わったのだ！評価を計算しているのだ！少し待ってほしいのだ！"
        );
      } catch {
        // ignore
      }
      try {
        await iv.evaluate();
      } catch {
        // エラーは useInterview 内で処理
      }
    }
  }

  // 結果画面へ遷移
  useEffect(() => {
    if (interview.phase === "result" && interview.state.evaluation) {
      sessionStorage.setItem(
        "interviewResult",
        JSON.stringify(interview.state.evaluation)
      );
      router.push("/result");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.phase, interview.state.evaluation]);

  // マイクボタン押下
  const handleMicClick = useCallback(() => {
    if (speech.isListening) {
      speech.stopListening();
      const finalTranscript = speech.transcript + speech.interimTranscript;
      console.log(`[interview-flow] Mic stopped. Transcript length=${finalTranscript.length}, phase=${interview.phase}`);

      if (interview.phase === "followup-listening") {
        // 深掘り質問への回答
        interview.submitFollowUpAnswer(finalTranscript);
      } else {
        // 通常の質問への回答
        interview.submitAnswer(finalTranscript);
      }
    } else {
      console.log(`[interview-flow] Mic started`);
      speech.startListening();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.isListening, speech.transcript, speech.interimTranscript, interview.phase]);

  // アバターの状態
  const avatarState = (() => {
    if (voicebox.isSpeaking) return "speaking" as const;
    if (interview.phase === "listening" || interview.phase === "followup-listening")
      return "listening" as const;
    if (interview.phase === "evaluating") return "thinking" as const;
    return "idle" as const;
  })();

  // フェーズに応じたステータステキスト
  const statusText = (() => {
    switch (interview.phase) {
      case "idle":
        return "準備中...";
      case "greeting":
        return "ずんだもんが挨拶しています...";
      case "questioning":
        return "質問を読み上げています...";
      case "listening":
        return speech.isListening
          ? "🔴 録音中... 回答が終わったらマイクボタンを押してください"
          : "マイクボタンを押して回答してください";
      case "followup":
        return "🔍 深掘り質問を読み上げています...";
      case "followup-listening":
        return speech.isListening
          ? "🔴 録音中... 深掘り質問への回答が終わったらマイクボタンを押してください"
          : "🔍 深掘り質問です。マイクボタンを押して回答してください";
      case "transitioning":
        return interview.deepDiveMode
          ? "深掘り質問を考えています..."
          : "次の質問に移ります...";
      case "evaluating":
        return "評価を計算しています... しばらくお待ちください";
      case "result":
        return "結果画面に移動します...";
      default:
        return "";
    }
  })();

  // 吹き出しのテキスト
  const bubbleText = (() => {
    if (interview.phase === "greeting") {
      return "こんにちはなのだ！ずんだもんが面接官を務めるのだ！リラックスして答えてほしいのだ！";
    }
    if (interview.phase === "followup" || interview.phase === "followup-listening") {
      return interview.state.followUpText || "もう少し詳しく教えてほしいのだ！";
    }
    if (interview.currentQuestion) {
      return interview.currentQuestion.zundamonText;
    }
    if (interview.phase === "evaluating") {
      return "評価を計算しているのだ... 少し待ってほしいのだ！";
    }
    return "準備中なのだ...";
  })();

  const canUseMic =
    interview.phase === "listening" || interview.phase === "followup-listening";

  // エラー表示
  const errorMessage = interview.error || voicebox.error || speech.error;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-green-200 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-green-800">ずんだもん面接</h1>
            {interview.deepDiveMode && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                🔍 深掘り
              </span>
            )}
          </div>
          {interview.state.questions.length > 0 && (
            <div className="w-48">
              <ProgressBar
                current={interview.progress.current}
                total={interview.progress.total}
              />
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* エラー表示 */}
        {errorMessage && (
          <div className="w-full max-w-lg bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* ずんだもんエリア */}
        <div className="flex flex-col items-center space-y-4">
          <ZundamonAvatar size="lg" state={avatarState} />
          <SpeechBubble text={bubbleText} variant="zundamon" />
        </div>

        {/* ステータス */}
        <p className="text-sm text-gray-600 text-center">{statusText}</p>

        {/* 音声認識テキスト表示 */}
        {(speech.transcript || speech.interimTranscript) && (
          <div className="w-full max-w-lg">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-500 mb-1">あなたの回答:</p>
              <p className="text-sm text-blue-900">
                {speech.transcript}
                <span className="text-blue-400">{speech.interimTranscript}</span>
              </p>
            </div>
          </div>
        )}

        {/* マイクボタン */}
        <div className="flex flex-col items-center space-y-2">
          <MicButton
            isListening={speech.isListening}
            disabled={!canUseMic}
            onClick={handleMicClick}
          />
          {!speech.isSupported && (
            <p className="text-xs text-red-500">
              お使いのブラウザは音声認識に対応していません
            </p>
          )}
        </div>

        {/* 読み込み中 */}
        {(interview.isLoading || interview.phase === "evaluating") && (
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-green-700">処理中...</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-green-50">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}
