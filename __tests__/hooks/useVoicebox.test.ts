import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoicebox } from "@/hooks/useVoicebox";

// Audio モックインスタンスを外部から参照するための変数
let currentAudioInstance: MockAudio;

// Audio モック（class で定義して new Audio() に対応）
class MockAudio {
  src = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();

  constructor(url?: string) {
    if (url) this.src = url;
    currentAudioInstance = this;
  }
}

function createMockFetchResponse(ok: boolean, status: number, body?: unknown) {
  const mockBlob = new Blob(["audio-data"], { type: "audio/wav" });
  return {
    ok,
    status,
    blob: vi.fn().mockResolvedValue(mockBlob),
    json: vi.fn().mockResolvedValue(body ?? {}),
    headers: new Headers({ "Content-Type": "audio/wav" }),
  };
}

describe("useVoicebox", () => {
  const originalFetch = global.fetch;
  const originalAudio = global.Audio;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.restoreAllMocks();
    // class ベースのモックを global.Audio に設定
    global.Audio = MockAudio as unknown as typeof Audio;
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.Audio = originalAudio;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("初期状態で isSpeaking=false, error=null", () => {
    const { result } = renderHook(() => useVoicebox());
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("正常な音声再生", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(true, 200));

    const { result } = renderHook(() => useVoicebox());

    let speakPromise!: Promise<void>;
    await act(async () => {
      speakPromise = result.current.speak("テストなのだ");
      // fetch + blob の非同期処理を完了させるために1ティック待つ
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // isSpeaking が true になる
    expect(result.current.isSpeaking).toBe(true);

    // 再生完了をシミュレート
    await act(async () => {
      currentAudioInstance.onended?.();
      await speakPromise;
    });

    expect(result.current.isSpeaking).toBe(false);
  });

  it("API エラーで error が設定される", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createMockFetchResponse(false, 500, { error: "音声合成に失敗" })
    );

    const { result } = renderHook(() => useVoicebox());

    await act(async () => {
      try {
        await result.current.speak("テスト");
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isSpeaking).toBe(false);
  });

  it("再生エラーで reject される", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(true, 200));

    const { result } = renderHook(() => useVoicebox());

    let caughtError: Error | undefined;
    await act(async () => {
      const promise = result.current.speak("テスト").catch((e) => {
        caughtError = e;
      });
      // fetch + blob の非同期処理を完了させる
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      // Audio が作成された後に onerror を発火
      currentAudioInstance.onerror?.();
      await promise;
    });

    expect(caughtError).toBeTruthy();
    expect(result.current.isSpeaking).toBe(false);
  });

  it("URL.createObjectURL が呼ばれる", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(true, 200));

    const { result } = renderHook(() => useVoicebox());

    act(() => {
      result.current.speak("テスト");
    });

    // fetch が完了するのを待つ
    await vi.waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it("連続呼び出しで前の再生がクリーンアップされる", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockFetchResponse(true, 200));

    const { result } = renderHook(() => useVoicebox());

    // 1回目の呼び出しで Audio を作成させる
    await act(async () => {
      result.current.speak("1つ目");
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // 2回目の呼び出し — cleanup で前の objectUrl が revokeObjectURL される
    await act(async () => {
      result.current.speak("2つ目");
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
