# ずんだもん面接 — AI 採用面接シミュレーター

VOICEVOX のずんだもんが面接官として技術面接を行う Web アプリケーションです。
マイクで回答し、全質問終了後に Ollama（ローカル LLM）が評価を生成します。

## デモフロー

1. トップページで質問数（3〜10）を設定し「面接を始めるのだ！」を押す
2. ずんだもんが VOICEVOX 音声で質問を読み上げる
3. マイクボタンで録音開始 → 音声認識（Web Speech API）でテキスト化
4. 全質問終了後、Ollama が回答を 10 点満点で評価
5. 結果ページでスコア・フィードバック・ずんだもんコメントを表示

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| 言語 | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| TTS（音声合成） | VOICEVOX Engine (speaker ID 3 = ずんだもん) |
| STT（音声認識） | Web Speech API (`webkitSpeechRecognition`) |
| LLM（評価） | Ollama + gemma3:4b |
| コンテナ | Docker, Docker Compose |

## 必要環境

- **Node.js** 20+
- **Docker / Docker Compose** （VOICEVOX・Ollama を動かす場合）
- **Chrome / Edge** （Web Speech API 対応ブラウザ）
- **マイク** （音声入力用）

## セットアップ

### 方法 1: Docker Compose（推奨）

全サービス（アプリ・VOICEVOX・Ollama）を一括起動します。

```bash
docker compose up -d
```

初回起動時は Ollama モデル (`gemma3:4b`, 約 3.3GB) のダウンロードが自動で行われます。
`http://localhost:3000` でアクセスできます。

### 方法 2: ローカル開発

VOICEVOX Engine と Ollama を別途起動した上で:

```bash
npm install
npm run dev
```

`http://localhost:3000` でアクセスできます。

### 環境変数

`.env.local` で設定します（デフォルト値付き）:

```dotenv
VOICEVOX_BASE_URL=http://localhost:50021
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

Docker Compose 使用時は `docker-compose.yml` の `environment` で自動設定されます。

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx              # トップ（設定画面）
│   ├── interview/page.tsx    # 面接画面
│   ├── result/page.tsx       # 結果画面
│   ├── layout.tsx            # 共通レイアウト
│   ├── globals.css           # グローバルスタイル
│   └── api/
│       ├── tts/route.ts      # VOICEVOX プロキシ API
│       ├── questions/route.ts # 質問取得 API
│       └── evaluate/route.ts  # Ollama 評価 API
├── components/
│   ├── ZundamonAvatar.tsx    # ずんだもん立ち絵（PSD素材ベース）
│   ├── MicButton.tsx         # マイクボタン
│   ├── SpeechBubble.tsx      # 吹き出し
│   ├── ProgressBar.tsx       # 進捗バー
│   └── ScoreCard.tsx         # スコアカード
├── hooks/
│   ├── useInterview.ts       # 面接フロー管理
│   ├── useSpeechRecognition.ts # Web Speech API ラッパー
│   └── useVoicebox.ts        # VOICEVOX TTS 再生
├── data/
│   └── questions.ts          # 質問プール（17問・5カテゴリ）
├── lib/
│   └── constants.ts          # 定数定義
└── types/
    └── index.ts              # TypeScript 型定義

public/
└── zundamon/                 # ずんだもん立ち絵画像（PSD→PNG変換済み）
    ├── idle.png              # 通常
    ├── speaking.png          # 話している
    ├── listening.png         # 聴いている
    └── thinking.png          # 考え中
```

## 質問カテゴリ

| カテゴリ | 問題数 | 内容 |
|---------|--------|------|
| 自己紹介 | 3問 | 経歴・志望動機 |
| 技術知識 | 5問 | REST/GraphQL, Git, テスト, パフォーマンス等 |
| 設計・アーキテクチャ | 4問 | マイクロサービス, DB設計, CI/CD等 |
| 行動面接 | 3問 | チーム経験・課題対応 |
| 逆質問 | 2問 | 面接官への質問 |

指定質問数に応じてカテゴリバランスを保って出題されます。

## Docker サービス構成

| サービス | イメージ | ポート | 役割 |
|---------|---------|--------|------|
| `app` | (Dockerfile) | 3000 | Next.js アプリ |
| `voicevox` | `voicevox/voicevox_engine:cpu-latest` | 50021 | 音声合成エンジン |
| `ollama` | `ollama/ollama:latest` | 11434 | LLM 推論サーバー |
| `ollama-pull` | `ollama/ollama:latest` | — | モデル自動ダウンロード（初回のみ） |

## ライセンス・素材

- ずんだもん立ち絵: [東北ずん子プロジェクト](https://zunko.jp/) フリー素材（非商用利用）
- VOICEVOX: [VOICEVOX](https://voicevox.hiroshiba.jp/) — 利用規約に従ってご利用ください
- ずんだもんキャラクターの利用は [ガイドライン](https://zunko.jp/guideline.html) に準拠してください
