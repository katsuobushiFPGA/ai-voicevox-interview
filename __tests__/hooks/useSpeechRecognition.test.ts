import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// テスト用インスタンスへの参照
let currentInstance: MockSpeechRecognition | null = null;

// Mock SpeechRecognition - class として定義（new で呼べるように）
class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;

  start = vi.fn(function (this: MockSpeechRecognition) {
    this.onstart?.();
  });
  stop = vi.fn(function (this: MockSpeechRecognition) {
    this.onend?.();
  });
  abort = vi.fn();

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn(() => true);

  constructor() {
    currentInstance = this;
  }

  // テスト用ヘルパー: 結果をシミュレート
  simulateResult(transcript: string, isFinal: boolean) {
    this.onresult?.({
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal,
          length: 1,
          0: { transcript },
          item: () => ({ transcript }),
        },
        item: () => ({
          isFinal,
          length: 1,
          0: { transcript },
          item: () => ({ transcript }),
        }),
      },
    });
  }

  simulateError(error: string) {
    this.onerror?.({ error, message: "" });
  }
}

describe("useSpeechRecognition", () => {
  beforeEach(() => {
    currentInstance = null;
    // @ts-expect-error: mock global with real class
    window.webkitSpeechRecognition = MockSpeechRecognition;
    // @ts-expect-error: mock global
    window.SpeechRecognition = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error: cleanup
    delete window.webkitSpeechRecognition;
    // @ts-expect-error: cleanup
    delete window.SpeechRecognition;
  });

  it("ブラウザサポートが検出される（対応）", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
  });

  it("ブラウザサポートが検出される（非対応）", () => {
    // @ts-expect-error: cleanup
    delete window.webkitSpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(false);
  });

  it("リスニング開始で isListening=true", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(result.current.isListening).toBe(true);
    expect(currentInstance!.start).toHaveBeenCalled();
  });

  it("リスニング停止で isListening=false", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      result.current.stopListening();
    });

    expect(result.current.isListening).toBe(false);
  });

  it("確定テキストが transcript に設定される", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      currentInstance!.simulateResult("こんにちは", true);
    });

    expect(result.current.transcript).toBe("こんにちは");
  });

  it("中間テキストが interimTranscript に設定される", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      currentInstance!.simulateResult("こんに", false);
    });

    expect(result.current.interimTranscript).toBe("こんに");
  });

  it("no-speech エラーが無視される", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      currentInstance!.simulateError("no-speech");
    });

    expect(result.current.error).toBeNull();
  });

  it("aborted エラーが無視される", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      currentInstance!.simulateError("aborted");
    });

    expect(result.current.error).toBeNull();
  });

  it("その他のエラーが報告される", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      currentInstance!.simulateError("network");
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("network");
  });

  it("停止で interimTranscript がクリアされる", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      currentInstance!.simulateResult("途中の", false);
    });

    expect(result.current.interimTranscript).toBe("途中の");

    act(() => {
      result.current.stopListening();
    });

    expect(result.current.interimTranscript).toBe("");
  });

  it("言語が ja-JP に設定される", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(currentInstance!.lang).toBe("ja-JP");
  });

  it("continuous が true に設定される", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(currentInstance!.continuous).toBe(true);
  });

  it("非サポートブラウザでの開始でエラー", () => {
    // @ts-expect-error: cleanup
    delete window.webkitSpeechRecognition;
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain("対応していません");
  });
});
