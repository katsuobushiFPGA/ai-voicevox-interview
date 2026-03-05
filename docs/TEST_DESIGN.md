# テスト設計書

## 1. テスト方針

### 1.1 テストレベル

| レベル | 対象 | ツール | 目的 |
|--------|------|--------|------|
| **ユニットテスト** | 純粋関数・ユーティリティ・API Route ハンドラ | Vitest | ロジックの正確性を保証 |
| **コンポーネントテスト** | React コンポーネント・カスタムフック | Vitest + React Testing Library | UI の振る舞いとフック状態遷移を検証 |
| **統合テスト** | API Route（外部サービスモック） | Vitest | API レイヤーのリクエスト〜レスポンスを検証 |
| **E2E テスト** | ページ遷移・面接フロー全体 | Playwright | ユーザー視点でのシナリオ検証 |

### 1.2 テストツール選定

- **Vitest**: Next.js + TypeScript との相性が良く、Jest 互換 API で高速
- **React Testing Library**: ユーザー操作ベースのテスト
- **MSW (Mock Service Worker)**: API モックにより外部依存（VOICEVOX, Ollama）を排除
- **Playwright**: クロスブラウザ E2E テスト

### 1.3 テスト対象の優先度

| 優先度 | 対象 | 理由 |
|--------|------|------|
| **P0（必須）** | `selectQuestions()`, `formatEvaluation()`, API Route ハンドラ | コアロジック。バグが面接体験に直結 |
| **P1（重要）** | `useInterview` フック, コンポーネント描画 | 状態遷移の複雑さ。ref ベース管理のデグレ防止 |
| **P2（推奨）** | `useSpeechRecognition`, `useVoicebox` | ブラウザ API 依存。モック範囲が限定的 |
| **P3（任意）** | E2E シナリオ | 手動テストでも代替可能 |

---

## 2. ユニットテスト設計

### 2.1 `selectQuestions()` — 質問選択ロジック

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| U-Q1 | 指定数の質問が返される | `count=5` | `length === 5` | 正常系 |
| U-Q2 | 最大数で全カテゴリから選択される | `count=10` | `length === 10` | 正常系 |
| U-Q3 | 最小数で質問が返される | `count=3` | `length === 3` | 正常系 |
| U-Q4 | カテゴリバランスが保たれる | `count=8` | 8カテゴリ各1問 | 正常系 |
| U-Q5 | 全質問数以上を要求しても枯渇で停止 | `count=100` | `length === 27`（全問） | 境界値 |
| U-Q6 | 各質問に必須フィールドが存在 | 任意 | `id`, `category`, `text`, `zundamonText` が非null | 正常系 |
| U-Q7 | 呼び出すたびに順序が変わる（シャッフル） | `count=5` ×複数回 | 少なくとも1回は異なる順序 | 正常系 |
| U-Q8 | 重複する質問IDが含まれない | `count=10` | 全IDがユニーク | 正常系 |

### 2.2 `shuffleArray()` — シャッフル関数

> ※ `shuffleArray` はモジュール内 private 関数のため、`selectQuestions` 経由で間接的にテストする

### 2.3 `formatEvaluation()` — 評価結果フォーマット

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| U-E1 | 正常なOllamaレスポンスをパース | 正常なscoresオブジェクト | 全フィールドが正しく変換される | 正常系 |
| U-E2 | スコアが `SCORE_MAX` を超える場合クランプ | `score: 15` | `score === 10` | 境界値 |
| U-E3 | スコアが 0 以下の場合 1 にクランプ | `score: -1` | `score === 1` | 境界値 |
| U-E4 | スコアが非数値の場合デフォルト1 | `score: "abc"` | `score === 1` | 異常系 |
| U-E5 | scoresが空配列の場合 | `scores: []` | answersに基づくデフォルトスコア生成 | 異常系 |
| U-E6 | overallFeedbackが未定義の場合 | `overallFeedback: undefined` | デフォルトメッセージ | 異常系 |
| U-E7 | zundamonCommentが未定義の場合 | `zundamonComment: undefined` | デフォルトメッセージ | 異常系 |
| U-E8 | totalScoreの計算が正しい | 3問×各5点 | `totalScore === 15` | 正常系 |
| U-E9 | maxTotalScoreの計算が正しい | 3問 | `maxTotalScore === 30` | 正常系 |
| U-E10 | questionIdマッピングがずれた場合 | scoreのquestionIdがanswersと不一致 | デフォルトスコア1が適用 | 異常系 |

### 2.4 `buildEvaluationPrompt()` — プロンプト生成

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| U-P1 | 全回答がプロンプトに含まれる | 3つの回答 | `質問1:`, `質問2:`, `質問3:` を含む | 正常系 |
| U-P2 | 無回答が「（無回答）」に変換される | `transcript: ""` | `（無回答）` を含む | 境界値 |
| U-P3 | SCORE_MAX 定数がプロンプトに反映 | - | `1〜10` を含む | 正常系 |

### 2.5 `buildFollowUpPrompt()` — 深掘りプロンプト生成

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| U-F1 | 質問と回答がプロンプトに含まれる | `question`, `answer` | 両方がプロンプト文字列に含まれる | 正常系 |

---

## 3. API Route テスト設計

### 3.1 `GET /api/questions`

| # | テストケース | リクエスト | 期待結果 | 分類 |
|---|-------------|-----------|----------|------|
| A-Q1 | デフォルト質問数 | `GET /api/questions` | `200`, 5問返却 | 正常系 |
| A-Q2 | count指定 | `GET /api/questions?count=7` | `200`, 7問返却 | 正常系 |
| A-Q3 | count が最小値未満 | `GET /api/questions?count=1` | `200`, 3問返却（クランプ） | 境界値 |
| A-Q4 | count が最大値超過 | `GET /api/questions?count=20` | `200`, 10問返却（クランプ） | 境界値 |
| A-Q5 | count が非数値 | `GET /api/questions?count=abc` | `200`, 5問返却（デフォルト） | 異常系 |
| A-Q6 | count が負数 | `GET /api/questions?count=-5` | `200`, 3問返却（クランプ） | 境界値 |
| A-Q7 | count が小数 | `GET /api/questions?count=5.7` | `200`, 5問返却 | 境界値 |
| A-Q8 | レスポンス形式が正しい | 任意 | `{ questions: Question[] }` | 正常系 |

### 3.2 `POST /api/tts`

| # | テストケース | リクエスト | 期待結果 | 分類 |
|---|-------------|-----------|----------|------|
| A-T1 | 正常な音声合成 | `{ text: "テスト" }` | `200`, `Content-Type: audio/wav` | 正常系 |
| A-T2 | テキスト未指定 | `{}` | `400`, エラーメッセージ | 異常系 |
| A-T3 | テキストが空文字 | `{ text: "" }` | `400`, エラーメッセージ | 異常系 |
| A-T4 | テキストが文字列以外 | `{ text: 123 }` | `400`, エラーメッセージ | 異常系 |
| A-T5 | カスタム speaker ID | `{ text: "テスト", speaker: 1 }` | `200`, speaker=1 で合成 | 正常系 |
| A-T6 | VOICEVOX未起動 (audio_query 失敗) | 正常リクエスト | `502`, エラーメッセージ | 異常系 |
| A-T7 | VOICEVOX未起動 (synthesis 失敗) | 正常リクエスト | `502`, エラーメッセージ | 異常系 |
| A-T8 | VOICEVOX接続不能 (ネットワークエラー) | 正常リクエスト | `503`, エラーメッセージ | 異常系 |

### 3.3 `POST /api/evaluate`

| # | テストケース | リクエスト | 期待結果 | 分類 |
|---|-------------|-----------|----------|------|
| A-E1 | 正常な評価リクエスト | 有効な answers 配列 | `200`, `EvaluationResult` | 正常系 |
| A-E2 | answers が空 | `{ answers: [] }` | `400`, エラーメッセージ | 異常系 |
| A-E3 | answers が未定義 | `{}` | `400`, エラーメッセージ | 異常系 |
| A-E4 | answers が配列でない | `{ answers: "invalid" }` | `400`, エラーメッセージ | 異常系 |
| A-E5 | Ollama 502 → リトライ成功 | 1回目502、2回目200 | `200`, 正常レスポンス | 正常系 |
| A-E6 | Ollama 503 → 全リトライ失敗 | 3回とも503 | `502`, エラーメッセージ | 異常系 |
| A-E7 | Ollama レスポンスが不正JSON | `response: "not json"` | `500`, パースエラー | 異常系 |
| A-E8 | Ollama 接続不能 → リトライ後エラー | fetch が throw | `503`, エラーメッセージ | 異常系 |
| A-E9 | リトライ間隔が指数バックオフ | 3回リトライ | delay=3000, 6000, 9000ms | 正常系 |

### 3.4 `POST /api/followup`

| # | テストケース | リクエスト | 期待結果 | 分類 |
|---|-------------|-----------|----------|------|
| A-F1 | 正常な深掘り質問生成 | `{ question, answer }` | `200`, `followUpQuestion` + `zundamonText` | 正常系 |
| A-F2 | question が未指定 | `{ answer: "..." }` | `400`, エラーメッセージ | 異常系 |
| A-F3 | answer が未指定 | `{ question: "..." }` | `400`, エラーメッセージ | 異常系 |
| A-F4 | Ollama レスポンスが不正JSON | パース失敗 | `200`, デフォルト深掘り質問 | フォールバック |
| A-F5 | Ollama 接続失敗 | fetch throw | `200`, デフォルト深掘り質問 | フォールバック |
| A-F6 | レスポンスに followUpQuestion が欠落 | `{ zundamonText: "..." }` | デフォルト値で補完 | フォールバック |

### 3.5 `fetchWithRetry()` — リトライユーティリティ

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| A-R1 | 1回目で成功 | 200 | 即座にレスポンス返却、リトライなし | 正常系 |
| A-R2 | 502→200 | 1回目502、2回目200 | 2回目のレスポンス返却 | 正常系 |
| A-R3 | 503×3 | 3回とも503 | 最後のレスポンス返却（ok=false） | 異常系 |
| A-R4 | 404→200 | 1回目404（モデル未ロード）、2回目200 | 2回目のレスポンス返却 | 正常系 |
| A-R5 | ネットワークエラー→成功 | 1回目throw、2回目200 | 2回目のレスポンス返却 | 正常系 |
| A-R6 | ネットワークエラー×3 | 3回ともthrow | 例外がスロー | 異常系 |
| A-R7 | 400エラー（リトライ対象外） | 400 | 即座にレスポンス返却、リトライなし | 異常系 |

---

## 4. カスタムフック テスト設計

### 4.1 `useInterview` — 面接フロー管理

#### 4.1.1 初期状態

| # | テストケース | 期待結果 | 分類 |
|---|-------------|----------|------|
| H-I1 | 初期 phase が `idle` | `phase === "idle"` | 正常系 |
| H-I2 | 初期 questions が空 | `state.questions.length === 0` | 正常系 |
| H-I3 | 初期 answers が空 | `state.answers.length === 0` | 正常系 |
| H-I4 | 初期 evaluation が null | `state.evaluation === null` | 正常系 |
| H-I5 | 初期 isLoading が false | `isLoading === false` | 正常系 |
| H-I6 | 初期 error が null | `error === null` | 正常系 |
| H-I7 | 初期 currentQuestion が null | `currentQuestion === null` | 正常系 |

#### 4.1.2 `startInterview()`

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-S1 | 面接開始で greeting に遷移 | `count=3` | `phase === "greeting"`, questions.length===3 | 正常系 |
| H-S2 | isLoading が一時的に true | `count=3` | 開始時 true → 完了時 false | 正常系 |
| H-S3 | API エラー時に error が設定 | fetch 失敗 | `error !== null` | 異常系 |
| H-S4 | deepDiveMode が設定される | `deepDive=true` | `deepDiveMode === true` | 正常系 |

#### 4.1.3 `submitAnswer()`

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-A1 | 回答が answers に追加される | `"エンジニアです"` | answers.length が +1 | 正常系 |
| H-A2 | phase が transitioning に遷移 | 任意 | `phase === "transitioning"` | 正常系 |
| H-A3 | Answer 構造が正しい | 任意 | `questionId`, `question`, `transcript` が正しい | 正常系 |
| H-A4 | currentQuestion が null の場合 | questions 未設定時 | 警告ログ、answers 変化なし | 異常系 |

#### 4.1.4 `submitFollowUpAnswer()`

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-FA1 | 最後の回答に深掘りQ&Aが追記される | `"詳細な回答"` | transcript に `【深掘り質問】` `【深掘り回答】` が含まれる | 正常系 |
| H-FA2 | phase が transitioning に遷移 | 任意 | `phase === "transitioning"` | 正常系 |
| H-FA3 | followUpText が null にリセット | 任意 | `state.followUpText === null` | 正常系 |
| H-FA4 | answers が空の場合 | answers 未設定 | 警告ログ、何も変更なし | 異常系 |

#### 4.1.5 `nextQuestion()`

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-N1 | 次の質問がある場合 | 残り質問あり | `hasMore === true`, `phase === "questioning"` | 正常系 |
| H-N2 | 最後の質問の後 | 残り質問なし | `hasMore === false`, `phase === "evaluating"` | 正常系 |
| H-N3 | currentQuestionIndex が +1 | 任意 | インデックス値が正確に更新 | 正常系 |

#### 4.1.6 `generateFollowUp()`

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-GF1 | 深掘り質問が取得される | 正常API | `followUpText` が設定, `phase === "followup"` | 正常系 |
| H-GF2 | 回答がない場合エラー | answers 空 | Error throw | 異常系 |

#### 4.1.7 `evaluate()`

| # | テストケース | 入力 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-EV1 | 評価完了で result に遷移 | 正常API | `phase === "result"`, evaluation が設定 | 正常系 |
| H-EV2 | API エラーで error 設定 | API失敗 | error メッセージ設定, 例外スロー | 異常系 |

#### 4.1.8 `reset()`

| # | テストケース | 期待結果 | 分類 |
|---|-------------|----------|------|
| H-R1 | 全状態が初期化される | `phase === "idle"`, questions=[], answers=[] | 正常系 |
| H-R2 | ref も初期化される | questionsRef=[], currentIndexRef=0 | 正常系 |
| H-R3 | isLoading, error もリセット | false, null | 正常系 |

#### 4.1.9 面接フロー統合（状態遷移シナリオ）

| # | テストケース | 遷移パス | 分類 |
|---|-------------|----------|------|
| H-FL1 | 通常フロー（深掘りなし、3問） | idle → greeting → questioning → listening → transitioning → questioning → ... → evaluating → result | 正常系 |
| H-FL2 | 深掘りありフロー（1問） | idle → greeting → questioning → listening → transitioning → followup → followup-listening → transitioning → evaluating → result | 正常系 |
| H-FL3 | 途中リセット | greeting → reset → idle | 正常系 |

### 4.2 `useSpeechRecognition` — 音声認識

| # | テストケース | 操作 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-SR1 | ブラウザサポート検出（対応） | Chrome env | `isSupported === true` | 正常系 |
| H-SR2 | ブラウザサポート検出（非対応） | Firefox env | `isSupported === false` | 正常系 |
| H-SR3 | リスニング開始 | `startListening()` | `isListening === true` | 正常系 |
| H-SR4 | リスニング停止 | `stopListening()` | `isListening === false`, `interimTranscript === ""` | 正常系 |
| H-SR5 | 確定テキスト取得 | `isFinal=true` 結果 | `transcript` が更新 | 正常系 |
| H-SR6 | 中間テキスト取得 | `isFinal=false` 結果 | `interimTranscript` が更新 | 正常系 |
| H-SR7 | no-speech エラーが無視される | `error="no-speech"` | `error === null` | 正常系 |
| H-SR8 | aborted エラーが無視される | `error="aborted"` | `error === null` | 正常系 |
| H-SR9 | その他のエラーが報告される | `error="network"` | `error !== null` | 異常系 |
| H-SR10 | タイムアウト時の自動再開 | onend（手動停止でない） | start() が再呼出し | 正常系 |
| H-SR11 | 手動停止後に再開されない | stopListening() → onend | start() が呼ばれない | 正常系 |
| H-SR12 | クリーンアップで abort される | アンマウント | abort() が呼ばれる | 正常系 |
| H-SR13 | 非サポートブラウザでの開始 | startListening() in Firefox | error メッセージ設定 | 異常系 |

### 4.3 `useVoicebox` — 音声合成

| # | テストケース | 操作 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| H-VB1 | 正常な音声再生 | `speak("テスト")` | `isSpeaking` true→false, Promise resolve | 正常系 |
| H-VB2 | API エラー | fetch 失敗 | `error` が設定, Promise reject | 異常系 |
| H-VB3 | 再生エラー | `audio.onerror` 発火 | `isSpeaking === false`, reject | 異常系 |
| H-VB4 | 連続呼び出しで前の再生がクリーンアップ | speak() → speak() | 前の Audio が pause, URL が revokeObjectURL | 正常系 |
| H-VB5 | アンマウント時のクリーンアップ | コンポーネント破棄 | Audio pause, URL revoke | 正常系 |

---

## 5. コンポーネント テスト設計

### 5.1 `ZundamonAvatar`

| # | テストケース | Props | 期待結果 | 分類 |
|---|-------------|-------|----------|------|
| C-ZA1 | デフォルト画像表示 | `phase="idle"` | 通常立ち絵が表示 | 正常系 |
| C-ZA2 | speaking 状態の画像 | `isSpeaking=true` | 話している立ち絵 | 正常系 |
| C-ZA3 | 画像切り替え | phase 変更 | 対応する表情に変更 | 正常系 |

### 5.2 `MicButton`

| # | テストケース | Props/操作 | 期待結果 | 分類 |
|---|-------------|------------|----------|------|
| C-MB1 | 非リスニング時の表示 | `isListening=false` | マイクアイコン表示 | 正常系 |
| C-MB2 | リスニング中の表示 | `isListening=true` | 録音中スタイル | 正常系 |
| C-MB3 | disabled 状態 | `disabled=true` | クリック無効 | 正常系 |
| C-MB4 | クリックでコールバック | クリック | `onClick` が呼ばれる | 正常系 |

### 5.3 `SpeechBubble`

| # | テストケース | Props | 期待結果 | 分類 |
|---|-------------|-------|----------|------|
| C-SB1 | テキスト表示 | `text="こんにちは"` | テキストが表示 | 正常系 |
| C-SB2 | 空テキスト | `text=""` | 空の吹き出し or 非表示 | 境界値 |

### 5.4 `ProgressBar`

| # | テストケース | Props | 期待結果 | 分類 |
|---|-------------|-------|----------|------|
| C-PB1 | 進行状況表示 | `current=2, total=5` | `2/5` 表示, 40% 進行 | 正常系 |
| C-PB2 | 完了状態 | `current=5, total=5` | 100% 進行 | 正常系 |
| C-PB3 | 開始状態 | `current=1, total=5` | 20% 進行 | 正常系 |

### 5.5 `ScoreCard`

| # | テストケース | Props | 期待結果 | 分類 |
|---|-------------|-------|----------|------|
| C-SC1 | スコア表示 | `score=7, max=10` | `7/10` 表示 | 正常系 |
| C-SC2 | フィードバック表示 | `feedback="良い回答です"` | フィードバックテキスト表示 | 正常系 |
| C-SC3 | 低スコア表示 | `score=2` | 低スコアスタイル | 正常系 |
| C-SC4 | 高スコア表示 | `score=9` | 高スコアスタイル | 正常系 |

---

## 6. ページ テスト設計

### 6.1 トップページ (`/`)

| # | テストケース | 操作 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| P-T1 | 初期表示 | ページ読み込み | ずんだもんアバター、質問数スライダー表示 | 正常系 |
| P-T2 | 質問数変更 | スライダー操作 | 質問数が反映 | 正常系 |
| P-T3 | 深掘りモード切替 | トグルクリック | ON/OFF 切替 | 正常系 |
| P-T4 | 面接開始ボタン | クリック | `/interview?count=N&deepDive=...` に遷移 | 正常系 |
| P-T5 | 質問数の範囲制約 | スライダー操作 | 3〜10 の範囲内 | 境界値 |

### 6.2 面接ページ (`/interview`)

| # | テストケース | 操作/条件 | 期待結果 | 分類 |
|---|-------------|-----------|----------|------|
| P-I1 | ページロードで面接開始 | クエリパラメータ `count=3` | greeting フェーズ | 正常系 |
| P-I2 | 挨拶後に質問表示 | greeting 完了 | questioning フェーズ, 質問テキスト表示 | 正常系 |
| P-I3 | マイクボタン押下で録音開始 | クリック | listening フェーズ | 正常系 |
| P-I4 | 録音停止で回答送信 | 停止ボタン | transitioning → 次質問 | 正常系 |
| P-I5 | 全質問回答後に評価開始 | 最後の回答送信 | evaluating フェーズ | 正常系 |
| P-I6 | 評価完了で結果ページ遷移 | 評価完了 | `/result` に遷移 | 正常系 |
| P-I7 | 深掘りモード有効時 | `deepDive=1` | followup フェーズが挿入される | 正常系 |

### 6.3 結果ページ (`/result`)

| # | テストケース | 条件 | 期待結果 | 分類 |
|---|-------------|------|----------|------|
| P-R1 | 評価結果表示 | 正常な evaluation | 各質問のスコア、フィードバック表示 | 正常系 |
| P-R2 | 総合スコア表示 | 正常な evaluation | `totalScore / maxTotalScore` 表示 | 正常系 |
| P-R3 | ずんだもんコメント表示 | 正常な evaluation | zundamonComment が表示 | 正常系 |
| P-R4 | もう一度ボタン | クリック | `/` に遷移 | 正常系 |
| P-R5 | 評価データなしでアクセス | 直接URL入力 | `/` にリダイレクト or エラー表示 | 異常系 |

---

## 7. E2E テスト設計

### 7.1 正常フローシナリオ

| # | シナリオ | 手順 | 期待結果 |
|---|---------|------|----------|
| E2E-1 | 面接完走（3問・深掘りなし） | 1. トップで3問選択 → 2. 面接開始 → 3. 各質問に音声回答（モック）→ 4. 評価結果確認 | 全画面が正常に遷移し、結果ページにスコアが表示される |
| E2E-2 | 面接完走（深掘りあり） | 1. 深掘りON → 2. 面接開始 → 3. 各質問+深掘り回答 → 4. 評価確認 | 深掘り質問が各回答後に表示され、結果に反映される |
| E2E-3 | 最大質問数で面接 | 10問設定 → 全問回答 | すべての質問に回答でき、評価が完了する |
| E2E-4 | もう一度面接 | 結果画面 → 再面接 | トップに戻り、新しい面接を開始できる |

### 7.2 異常フローシナリオ

| # | シナリオ | 手順 | 期待結果 |
|---|---------|------|----------|
| E2E-5 | VOICEVOX 未起動 | TTS APIモック = 503 | エラー表示、面接は進行しない |
| E2E-6 | Ollama 未起動 | 評価APIモック = 503 | エラー表示、リトライ後にエラーメッセージ |
| E2E-7 | ブラウザ非対応 | Firefox で STT 未サポート | 音声認識非対応メッセージが表示 |

---

## 8. テストカバレッジ目標

| 対象 | 目標カバレッジ | 理由 |
|------|--------------|------|
| `src/data/questions.ts` | **90%+** | 純粋関数、テスト容易 |
| `src/app/api/*/route.ts` | **85%+** | APIの信頼性に直結 |
| `src/hooks/useInterview.ts` | **80%+** | 状態遷移の複雑さ |
| `src/hooks/useSpeechRecognition.ts` | **60%+** | ブラウザAPI依存 |
| `src/hooks/useVoicebox.ts` | **60%+** | Audio API 依存 |
| `src/components/*` | **70%+** | 描画ロジック検証 |

---

## 9. モック戦略

### 9.1 外部サービスモック

| サービス | モック方法 | 対象テスト |
|---------|----------|-----------|
| **VOICEVOX Engine** | MSW で `/audio_query`, `/synthesis` をモック | TTS API テスト |
| **Ollama** | MSW で `/api/generate` をモック | Evaluate / Followup API テスト |
| **fetch (クライアント)** | vi.fn() でモック | フックテスト |

### 9.2 ブラウザ API モック

| API | モック方法 | 対象テスト |
|-----|----------|-----------|
| **WebSpeechRecognition** | カスタムモッククラス | `useSpeechRecognition` テスト |
| **Audio** | vi.fn() + イベントシミュレーション | `useVoicebox` テスト |
| **URL.createObjectURL** | vi.fn() | `useVoicebox` テスト |
| **URL.revokeObjectURL** | vi.fn() | `useVoicebox` テスト |

### 9.3 Next.js モック

| 対象 | モック方法 |
|------|----------|
| `next/navigation` (`useRouter`, `useSearchParams`) | vi.mock |
| `next/server` (`NextRequest`, `NextResponse`) | 実オブジェクト or ラッパー |

---

## 10. ディレクトリ構成（テスト）

```
__tests__/
├── unit/
│   ├── questions.test.ts          # selectQuestions, questionPool
│   └── constants.test.ts          # 定数値の検証
├── api/
│   ├── questions.test.ts          # GET /api/questions
│   ├── tts.test.ts                # POST /api/tts
│   ├── evaluate.test.ts           # POST /api/evaluate + fetchWithRetry
│   └── followup.test.ts           # POST /api/followup
├── hooks/
│   ├── useInterview.test.ts       # 面接フロー管理
│   ├── useSpeechRecognition.test.ts
│   └── useVoicebox.test.ts
├── components/
│   ├── ZundamonAvatar.test.tsx
│   ├── MicButton.test.tsx
│   ├── SpeechBubble.test.tsx
│   ├── ProgressBar.test.tsx
│   └── ScoreCard.test.tsx
├── pages/
│   ├── home.test.tsx              # トップページ
│   ├── interview.test.tsx         # 面接ページ
│   └── result.test.tsx            # 結果ページ
└── e2e/
    ├── interview-flow.spec.ts     # 正常フロー
    └── error-scenarios.spec.ts    # 異常フロー
```

---

## 11. テスト実行コマンド

```bash
# ユニット + コンポーネント + API テスト
npx vitest run

# ウォッチモード
npx vitest

# カバレッジレポート
npx vitest run --coverage

# 特定テストファイル実行
npx vitest run __tests__/unit/questions.test.ts

# E2E テスト
npx playwright test

# E2E テスト（UI モード）
npx playwright test --ui
```
