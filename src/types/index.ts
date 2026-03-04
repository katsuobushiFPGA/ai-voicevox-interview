export interface Question {
  id: number;
  category: QuestionCategory;
  text: string;
  zundamonText: string; // ずんだもん口調のテキスト
}

export type QuestionCategory =
  | "self-introduction"
  | "technical"
  | "architecture"
  | "behavioral"
  | "reverse";

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  "self-introduction": "自己紹介",
  technical: "技術知識",
  architecture: "設計・アーキテクチャ",
  behavioral: "行動面接",
  reverse: "逆質問",
};

export interface Answer {
  questionId: number;
  question: string;
  transcript: string;
}

export interface QuestionScore {
  questionId: number;
  category: string;
  question: string;
  answer: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  scores: QuestionScore[];
  totalScore: number;
  maxTotalScore: number;
  overallFeedback: string;
  zundamonComment: string; // ずんだもん口調の総評
}

export type InterviewPhase =
  | "idle"
  | "greeting"
  | "questioning"
  | "listening"
  | "transitioning"
  | "evaluating"
  | "result";

export interface InterviewState {
  phase: InterviewPhase;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Answer[];
  evaluation: EvaluationResult | null;
}
