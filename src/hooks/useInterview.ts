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
  followUpText: null,
};

export interface NextQuestionResult {
  hasMore: boolean;
  question: Question | null;
}

export interface FollowUpResult {
  followUpQuestion: string;
  zundamonText: string;
}

interface InterviewHook {
  state: InterviewState;
  phase: InterviewPhase;
  currentQuestion: Question | null;
  progress: { current: number; total: number };
  deepDiveMode: boolean;
  startInterview: (questionCount: number, deepDive?: boolean) => Promise<void>;
  setPhase: (phase: InterviewPhase) => void;
  submitAnswer: (transcript: string) => void;
  submitFollowUpAnswer: (transcript: string) => void;
  nextQuestion: () => NextQuestionResult;
  generateFollowUp: () => Promise<FollowUpResult>;
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
  const questionsRef = useRef<Question[]>([]);
  const currentIndexRef = useRef(0);
  const answersRef = useRef<Answer[]>([]);
  const deepDiveModeRef = useRef(false);

  const phase = state.phase;
  const deepDiveMode = deepDiveModeRef.current;

  const currentQuestion =
    state.questions[state.currentQuestionIndex] ?? null;

  const progress = {
    current: state.currentQuestionIndex + 1,
    total: state.questions.length,
  };

  const setPhase = useCallback((phase: InterviewPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const startInterview = useCallback(async (questionCount: number, deepDive: boolean = false) => {
    setIsLoading(true);
    setError(null);
    deepDiveModeRef.current = deepDive;

    try {
      const res = await fetch(`/api/questions?count=${questionCount}`);
      if (!res.ok) throw new Error("質問の取得に失敗しました");
      const data = await res.json();

      questionsRef.current = data.questions;
      currentIndexRef.current = 0;
      answersRef.current = [];

      console.log(`[useInterview] startInterview: loaded ${data.questions.length} questions, deepDive=${deepDive}`);

      setState({
        phase: "greeting",
        currentQuestionIndex: 0,
        questions: data.questions,
        answers: [],
        evaluation: null,
        followUpText: null,
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
    answersRef.current = newAnswers;

    console.log(`[useInterview] submitAnswer: answered Q${question.id}, total answers=${newAnswers.length}, currentIndex=${currentIndexRef.current}`);

    setState((prev) => ({
      ...prev,
      answers: newAnswers,
      phase: "transitioning" as InterviewPhase,
    }));
  }, []);

  /** 深掘り質問をLLMで生成 */
  const generateFollowUp = useCallback(async (): Promise<FollowUpResult> => {
    const latestAnswer = answersRef.current[answersRef.current.length - 1];
    if (!latestAnswer) {
      throw new Error("回答がありません");
    }

    console.log(`[useInterview] generateFollowUp: question="${latestAnswer.question.substring(0, 30)}...", answer="${latestAnswer.transcript.substring(0, 30)}..."`);

    const res = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: latestAnswer.question,
        answer: latestAnswer.transcript,
      }),
    });

    const data = await res.json();

    console.log(`[useInterview] generateFollowUp: got "${data.zundamonText?.substring(0, 40)}..."`);

    setState((prev) => ({
      ...prev,
      phase: "followup" as InterviewPhase,
      followUpText: data.zundamonText,
    }));

    return data as FollowUpResult;
  }, []);

  /** 深掘り質問への回答を追記 */
  const submitFollowUpAnswer = useCallback((transcript: string) => {
    const answers = answersRef.current;
    if (answers.length === 0) {
      console.warn("[useInterview] submitFollowUpAnswer: no answers to append to");
      return;
    }

    // 最後の回答のtranscriptに深掘りQ&Aを追記
    const lastIdx = answers.length - 1;
    const lastAnswer = answers[lastIdx];
    const followUpText = state.followUpText || "（深掘り質問）";
    const updatedTranscript = `${lastAnswer.transcript}\n\n【深掘り質問】${followUpText}\n【深掘り回答】${transcript}`;

    const updatedAnswers = [...answers];
    updatedAnswers[lastIdx] = {
      ...lastAnswer,
      transcript: updatedTranscript,
    };
    answersRef.current = updatedAnswers;

    console.log(`[useInterview] submitFollowUpAnswer: appended followup to Q${lastAnswer.questionId}`);

    setState((prev) => ({
      ...prev,
      answers: updatedAnswers,
      followUpText: null,
      phase: "transitioning" as InterviewPhase,
    }));
  }, [state.followUpText]);

  const nextQuestion = useCallback((): NextQuestionResult => {
    const questions = questionsRef.current;
    const currentIdx = currentIndexRef.current;
    const nextIndex = currentIdx + 1;

    console.log(`[useInterview] nextQuestion: currentIdx=${currentIdx}, nextIndex=${nextIndex}, questionsCount=${questions.length}`);

    if (nextIndex < questions.length) {
      const nextQ = questions[nextIndex];
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
    deepDiveModeRef.current = false;
    setState(initialState);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    state,
    phase,
    currentQuestion,
    progress,
    deepDiveMode,
    startInterview,
    setPhase,
    submitAnswer,
    submitFollowUpAnswer,
    nextQuestion,
    generateFollowUp,
    evaluate,
    reset,
    isLoading,
    error,
  };
}
