import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInterview } from "@/hooks/useInterview";
import { Question } from "@/types";

const mockQuestions: Question[] = [
  { id: 1, category: "self-introduction", text: "自己紹介をお願いします", zundamonText: "自己紹介をお願いするのだ！" },
  { id: 2, category: "career-change", text: "転職理由を教えてください", zundamonText: "転職理由を教えてほしいのだ！" },
  { id: 3, category: "motivation", text: "志望理由を教えてください", zundamonText: "志望理由を教えてほしいのだ！" },
];

describe("useInterview", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function setupFetchForQuestions() {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ questions: mockQuestions }), { status: 200 })
    );
  }

  describe("初期状態", () => {
    it("phase が idle", () => {
      const { result } = renderHook(() => useInterview());
      expect(result.current.phase).toBe("idle");
    });

    it("questions が空", () => {
      const { result } = renderHook(() => useInterview());
      expect(result.current.state.questions).toHaveLength(0);
    });

    it("answers が空", () => {
      const { result } = renderHook(() => useInterview());
      expect(result.current.state.answers).toHaveLength(0);
    });

    it("evaluation が null", () => {
      const { result } = renderHook(() => useInterview());
      expect(result.current.state.evaluation).toBeNull();
    });

    it("isLoading が false", () => {
      const { result } = renderHook(() => useInterview());
      expect(result.current.isLoading).toBe(false);
    });

    it("error が null", () => {
      const { result } = renderHook(() => useInterview());
      expect(result.current.error).toBeNull();
    });

    it("currentQuestion が null", () => {
      const { result } = renderHook(() => useInterview());
      expect(result.current.currentQuestion).toBeNull();
    });
  });

  describe("startInterview", () => {
    it("面接開始で greeting に遷移する", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      expect(result.current.phase).toBe("greeting");
      expect(result.current.state.questions).toHaveLength(3);
    });

    it("API エラー時に error が設定される", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        new Response("error", { status: 500 })
      );

      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      expect(result.current.error).toBeTruthy();
    });

    it("deepDiveMode が設定される", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3, true);
      });

      expect(result.current.deepDiveMode).toBe(true);
    });
  });

  describe("submitAnswer", () => {
    it("回答が answers に追加される", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      act(() => {
        result.current.submitAnswer("エンジニアの田中です");
      });

      expect(result.current.state.answers).toHaveLength(1);
      expect(result.current.state.answers[0].transcript).toBe("エンジニアの田中です");
    });

    it("phase が transitioning に遷移する", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      act(() => {
        result.current.submitAnswer("テスト");
      });

      expect(result.current.phase).toBe("transitioning");
    });

    it("Answer 構造が正しい", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      act(() => {
        result.current.submitAnswer("テスト回答");
      });

      const answer = result.current.state.answers[0];
      expect(answer.questionId).toBe(mockQuestions[0].id);
      expect(answer.question).toBe(mockQuestions[0].text);
      expect(answer.transcript).toBe("テスト回答");
    });
  });

  describe("nextQuestion", () => {
    it("次の質問がある場合 hasMore=true", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      act(() => {
        result.current.submitAnswer("回答1");
      });

      let nextResult: { hasMore: boolean };
      act(() => {
        nextResult = result.current.nextQuestion();
      });

      expect(nextResult!.hasMore).toBe(true);
      expect(result.current.phase).toBe("questioning");
    });

    it("最後の質問の後 hasMore=false", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      // 3問を順番に回答
      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.submitAnswer(`回答${i + 1}`);
        });
        if (i < 2) {
          act(() => {
            result.current.nextQuestion();
          });
        }
      }

      let nextResult: { hasMore: boolean };
      act(() => {
        nextResult = result.current.nextQuestion();
      });

      expect(nextResult!.hasMore).toBe(false);
      expect(result.current.phase).toBe("evaluating");
    });

    it("currentQuestionIndex が更新される", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      expect(result.current.state.currentQuestionIndex).toBe(0);

      act(() => {
        result.current.submitAnswer("回答");
      });

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.state.currentQuestionIndex).toBe(1);
    });
  });

  describe("submitFollowUpAnswer", () => {
    it("深掘り回答が最後の回答に追記される", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3, true);
      });

      act(() => {
        result.current.submitAnswer("元の回答");
      });

      // followUpText を設定するために setPhase + state を更新
      act(() => {
        result.current.setPhase("followup");
      });

      act(() => {
        result.current.submitFollowUpAnswer("詳細な回答");
      });

      const lastAnswer = result.current.state.answers[result.current.state.answers.length - 1];
      expect(lastAnswer.transcript).toContain("元の回答");
      expect(lastAnswer.transcript).toContain("【深掘り回答】詳細な回答");
    });

    it("phase が transitioning に遷移する", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3, true);
      });

      act(() => {
        result.current.submitAnswer("テスト");
      });

      act(() => {
        result.current.submitFollowUpAnswer("深掘り回答");
      });

      expect(result.current.phase).toBe("transitioning");
    });
  });

  describe("evaluate", () => {
    it("評価完了で result に遷移する", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      act(() => {
        result.current.submitAnswer("回答");
      });

      const mockEvaluation = {
        scores: [{ questionId: 1, category: "test", question: "q", answer: "a", score: 7, feedback: "good" }],
        totalScore: 7,
        maxTotalScore: 10,
        overallFeedback: "良い",
        zundamonComment: "よかったのだ！",
      };

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockEvaluation), { status: 200 })
      );

      await act(async () => {
        await result.current.evaluate();
      });

      expect(result.current.phase).toBe("result");
      expect(result.current.state.evaluation).toBeTruthy();
    });

    it("API エラーで error が設定される", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      global.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "評価失敗" }), { status: 500 })
      );

      await act(async () => {
        try {
          await result.current.evaluate();
        } catch {
          // expected
        }
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe("reset", () => {
    it("全状態が初期化される", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      act(() => {
        result.current.submitAnswer("テスト");
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.phase).toBe("idle");
      expect(result.current.state.questions).toHaveLength(0);
      expect(result.current.state.answers).toHaveLength(0);
      expect(result.current.state.evaluation).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("progress", () => {
    it("進捗が正しく計算される", async () => {
      setupFetchForQuestions();
      const { result } = renderHook(() => useInterview());

      await act(async () => {
        await result.current.startInterview(3);
      });

      expect(result.current.progress).toEqual({ current: 1, total: 3 });

      act(() => {
        result.current.submitAnswer("回答");
      });

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.progress).toEqual({ current: 2, total: 3 });
    });
  });

  describe("setPhase", () => {
    it("直接 phase を変更できる", () => {
      const { result } = renderHook(() => useInterview());

      act(() => {
        result.current.setPhase("greeting");
      });

      expect(result.current.phase).toBe("greeting");
    });
  });
});
