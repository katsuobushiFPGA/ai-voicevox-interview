# AGENTS.md — AI エージェント向けガイド

このファイルは AI コーディングエージェントがこのプロジェクトを理解・修正するための指針です。

## プロジェクト概要

VOICEVOX のずんだもんが面接官を務める AI 技術面接シミュレーター。
Next.js App Router + TypeScript で構築され、VOICEVOX（TTS）、Web Speech API（STT）、Ollama（LLM 評価）を組み合わせています。

## ビルド・実行コマンド

```bash
npm install          # 依存関係インストール
npm run dev          # 開発サーバー起動 (Turbopack)
npm run build        # プロダクションビルド
npm run lint         # ESLint 実行
docker compose up -d # 全サービス一括起動（Docker）
```

## アーキテクチャ

### フロントエンド（Client Components）

- **ページ遷移**: `/` → `/interview?count=N` → `/result`
- **状態管理**: `useInterview` フックが `InterviewPhase`（7 状態）を管理。React の `useState` + `useRef` のハイブリッドで、ref を正とした同期的な状態追跡を行う
- **音声入出力**: `useSpeechRecognition`（STT）と `useVoicebox`（TTS）が独立したカスタムフック
- **面接フロー制御**: `interview/page.tsx` の単一 `useEffect` がオーケストレーターとして各フェーズを処理

### バックエンド（API Routes）

- `POST /api/tts` — VOICEVOX Engine へのプロキシ（text → audio/wav）
- `GET /api/questions?count=N` — カテゴリバランスを保った質問セット生成
- `POST /api/evaluate` — Ollama に回答を送信し JSON 形式の評価を取得

### 外部サービス

- **VOICEVOX Engine** (`localhost:50021`): speaker ID 3 = ずんだもん（ノーマル）
- **Ollama** (`localhost:11434`): モデル `gemma3:4b`（CPU 推論で 15〜30 秒/リクエスト）

## 重要な設計判断・既知の注意点

### useInterview の ref ベース状態管理

React 19 の `setState` updater は即座に state を反映しないため、`questionsRef`・`currentIndexRef`・`answersRef` の 3 つの ref を正として管理しています。**state の更新関数内で ref を手動更新し、useEffect による ref 同期は行っていません**（stale state による上書きを防ぐため）。

### evaluate API のリトライ

Ollama のモデルロードに時間がかかる場合があるため、`fetchWithRetry` で 502/503/404 を最大 3 回リトライします。初回リクエスト時はモデルロードで特に遅くなります。

### ずんだもん画像

`public/zundamon/` の PNG 画像は PSD 立ち絵素材（`ずんだもん立ち絵素材2.3.psd`）からレイヤーを合成して生成されたものです。表情を変えたい場合は `psd-tools` を使って再エクスポートしてください。

### Web Speech API

`webkitSpeechRecognition` を使用しており、**Chrome / Edge でのみ動作**します。Firefox / Safari は非対応です。

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router ページ・API
│   ├── page.tsx            # トップ（質問数設定）
│   ├── interview/page.tsx  # 面接実行画面
│   ├── result/page.tsx     # 結果表示画面
│   └── api/
│       ├── tts/route.ts    # VOICEVOX プロキシ
│       ├── questions/route.ts
│       └── evaluate/route.ts  # Ollama 評価（リトライ付き）
├── components/             # UI コンポーネント
│   ├── ZundamonAvatar.tsx  # 立ち絵表示（4状態切替）
│   ├── MicButton.tsx
│   ├── SpeechBubble.tsx
│   ├── ProgressBar.tsx
│   └── ScoreCard.tsx
├── hooks/                  # カスタムフック
│   ├── useInterview.ts     # 面接フロー管理（ref ベース）
│   ├── useSpeechRecognition.ts
│   └── useVoicebox.ts
├── data/
│   └── questions.ts        # 質問プール（17問・5カテゴリ）
├── lib/
│   └── constants.ts        # 定数（SPEAKER_ID, SCORE_MAX 等）
└── types/
    └── index.ts            # 型定義（InterviewPhase, Question, Answer 等）
```

## 型定義（主要）

- `InterviewPhase`: `"idle" | "greeting" | "questioning" | "listening" | "transitioning" | "evaluating" | "result"`
- `Question`: `{ id, category, text, zundamonText }`
- `Answer`: `{ questionId, question, transcript }`
- `EvaluationResult`: `{ scores, totalScore, maxTotalScore, overallFeedback, zundamonComment }`

## 環境変数

| 変数 | デフォルト | 説明 |
|-----|-----------|------|
| `VOICEVOX_BASE_URL` | `http://localhost:50021` | VOICEVOX Engine URL |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API URL |
| `OLLAMA_MODEL` | `gemma3:4b` | 使用する LLM モデル名 |

## コーディング規約

- 言語: TypeScript strict モード
- スタイル: Tailwind CSS 4（ユーティリティクラス）
- コンポーネント: 関数コンポーネント + named export
- Client Component は先頭に `"use client"` を記述
- UI テキストはすべて日本語
- コンソールログは `[useInterview]`、`[interview-flow]`、`[evaluate]` プレフィックス付き

## テスト方法

```bash
# TTS API
curl -X POST http://localhost:3000/api/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"テストなのだ"}'

# 質問取得 API
curl "http://localhost:3000/api/questions?count=3"

# 評価 API（15〜30秒かかる場合あり）
curl -X POST http://localhost:3000/api/evaluate \
  -H 'Content-Type: application/json' \
  -d '{"answers":[{"questionId":1,"question":"自己紹介","transcript":"エンジニアです"}]}'
```

## Docker 構成

4 サービス構成（`docker-compose.yml`）:

1. **app**: Next.js アプリ（マルチステージビルド）
2. **voicevox**: VOICEVOX Engine CPU 版
3. **ollama**: Ollama LLM サーバー（永続ボリューム `ollama_data`）
4. **ollama-pull**: 初回モデルダウンロード用サイドカー（`ollama pull` CLI 使用）
