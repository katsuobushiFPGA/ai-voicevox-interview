"use client";

import { useState, useCallback, useRef } from "react";
import {
  InterviewState,
  InterviewPhase,
  Question,
  Answer,
  EvaluationResult,
} from "@/types";

const initialState: InterviewState = {
  phase: "idle",
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  evaluation: null,
};

export interface NextQuestionResult {
  hasMore: boolean;
  question: Question | null;
}

interface InterviewHook {
  state: InterviewState;
  phase: InterviewPhase;
  currentQuestion: Question | null;
  progress: { current: number; total: number };
  startInterview: (questionCount: number) => Promise<void>;
  setPhase: (phase: InterviewPhase) => void;
  submitAnswer: (transcript: string) => void;
  nextQuestion: () => NextQuestionResult;
  evaluate: () => Promise<EvaluationResult>;
  reset: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useInterview(): InterviewHook {
  const [state, setState] = useState<InterviewState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── refs で最新の状態を追跡 ───
  // 重要: useEffect による同期は使わない。
  // 各ミューテーション関数内で直接 ref を更新する（setState の遅延実行に依存しない）。
  const questionsRef = useRef<Question[]>([]);
  const currentIndexRef = useRef(0);
  const answersRef = useRef<Answer[]>([]);

  const phase = state.phase;

  const currentQuestion =
    state.questions[state.currentQuestionIndex] ?? null;

  const progress = {
    current: state.currentQuestionIndex + 1,
    total: state.questions.length,
  };

  const setPhase = useCallback((phase: InterviewPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const startInterview = useCallback(async (questionCount: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/questions?count=${questionCount}`);
      if (!res.ok) throw new Error("質問の取得に失敗しました");
      const data = await res.json();

      // ref を先に更新（setState の処理タイミングに依存しない）
      questionsRef.current = data.questions;
      currentIndexRef.current = 0;
      answersRef.current = [];

      console.log(`[useInterview] startInterview: loaded ${data.questions.length} questions`);

      setState({
        phase: "greeting",
        currentQuestionIndex: 0,
        questions: data.questions,
        answers: [],
        evaluation: null,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "エラーが発生しました";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = useCallback((transcript: string) => {
    // ref から直接読み取って answer を構築（setState updater 内に依存しない）
    const question = questionsRef.current[currentIndexRef.current];
    if (!question) {
      console.warn("[useInterview] submitAnswer: no current question found");
      return;
    }

    const answer: Answer = {
      questionId: question.id,
      question: question.text,
      transcript,
    };

    const newAnswers = [...answersRef.current, answer];
    // ref を同期的に更新
    answersRef.current = newAnswers;

    console.log(`[useInterview] submitAnswer: answered Q${question.id}, total answers=${newAnswers.length}, currentIndex=${currentIndexRef.current}`);

    setState((prev) => ({
      ...prev,
      answers: newAnswers,
      phase: "transitioning" as InterviewPhase,
    }));
  }, []);

  const nextQuestion = useCallback((): NextQuestionResult => {
    // ref から直接読み取る（setState のアップデーターに依存しない）
    const questions = questionsRef.current;
    const currentIdx = currentIndexRef.current;
    const nextIndex = currentIdx + 1;

    console.log(`[useInterview] nextQuestion: currentIdx=${currentIdx}, nextIndex=${nextIndex}, questionsCount=${questions.length}`);

    if (nextIndex < questions.length) {
      const nextQ = questions[nextIndex];
      // ref を同期的に更新（useEffect 経由ではない）
      currentIndexRef.current = nextIndex;

      console.log(`[useInterview] nextQuestion: hasMore=true, nextQ.id=${nextQ.id}`);

      setState((prev) => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        phase: "questioning" as InterviewPhase,
      }));
      return { hasMore: true, question: nextQ };
    } else {
      console.log(`[useInterview] nextQuestion: hasMore=false, all questions done`);

      setState((prev) => ({
        ...prev,
        phase: "evaluating" as InterviewPhase,
      }));
      return { hasMore: false, question: null };
    }
  }, []);

  const evaluate = useCallback(async (): Promise<EvaluationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const answers = answersRef.current;
      console.log(`[useInterview] evaluate: sending ${answers.length} answers`);

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || "評価リクエストに失敗しました"
        );
      }

      const evaluation: EvaluationResult = await res.json();

      setState((p) => ({
        ...p,
        evaluation,
        phase: "result" as InterviewPhase,
      }));
      setIsLoading(false);
      return evaluation;
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "評価でエラーが発生しました";
      setError(message);
      setIsLoading(false);
      throw e;
    }
  }, []);

  const reset = useCallback(() => {
    questionsRef.current = [];
    currentIndexRef.current = 0;
    answersRef.current = [];
    setState(initialState);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    state,
    phase,
    currentQuestion,
    progress,
    startInterview,
    setPhase,
    submitAnswer,
    nextQuestion,
    evaluate,
    reset,
    isLoading,
    error,
  };
}
