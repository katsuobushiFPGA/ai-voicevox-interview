export interface Question {
  id: number;
  category: QuestionCategory;
  text: string;
  zundamonText: string; // ずんだもん口調のテキスト
}

export type QuestionCategory =
  | "self-introduction"
  | "career-change"
  | "motivation"
  | "career-plan"
  | "experience"
  | "strengths"
  | "technical"
  | "reverse";

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  "self-introduction": "自己紹介",
  "career-change": "転職理由",
  motivation: "志望理由",
  "career-plan": "キャリアプラン・転職の軸",
  experience: "成功体験・失敗体験",
  strengths: "強み・弱み",
  technical: "技術知識",
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
  | "followup"
  | "followup-listening"
  | "transitioning"
  | "evaluating"
  | "result";

export interface InterviewState {
  phase: InterviewPhase;
  currentQuestionIndex: number;
  questions: Question[];
  answers: Answer[];
  evaluation: EvaluationResult | null;
  followUpText: string | null; // 深掘り質問テキスト（ずんだもん口調）
}
