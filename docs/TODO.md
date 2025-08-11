# TODOリスト

## 完了済みの作業

- [x] **語彙情報への「解説」項目追加**
    - [x] `src/models/lexicalEntry.ts` のモデルに `explanation` プロパティを追加した。
    - [x] `src/services/geminiService.ts` のプロンプトを更新し、解説を生成させるようにした。
    - [x] `src/formatters/lexicalEntryFormatter.ts` を更新し、解説を表示するようにした。
    - [x] `docs/AI語彙情報生成仕様書.md` を更新した。
    - [x] `docs/プラグイン仕様書.md` を更新した。
- [x] **UI改善: AIチャットのコピー機能実装**
    - `docs/UI改善計画.md` に基づき、チャット内容をコピーする機能を追加した。
- [x] **閲覧者コメント機能の実装**
    - [x] `src/models/CommentEntry.ts` を作成し、コメントのデータモデルを定義する。
    - [x] `src/models/lexicalEntry.ts` に `comments: CommentEntry[]` プロパティを追加し、JSONスキーマを更新する。
    - [x] `src/services/geminiService.ts` のプロンプトを更新し、閲覧者コメントを生成する指示を追加する。
    - [x] `src/formatters/lexicalEntryFormatter.ts` を更新し、コメントをMarkdown形式で表示する処理を追加する。
    - [x] `docs/AI語彙情報生成仕様書.md` と `docs/プラグイン仕様書.md` に新機能の仕様を追記する。

## 次回作業予定

- [ ] **ステータスバーの活用**: `main.ts` で追加されているステータスバー (`statusBarItemEl`) に、現在のAIの動作状況（例：「応答生成中...」「待機中」）などを表示し、ユーザー体験を向上させます。
- [ ] **エラーハンドリングの強化**: `geminiService.ts` でのAI APIエラーやFunction Callingの失敗時に、より詳細で分かりやすいエラーメッセージをユーザーに通知する仕組みを強化します。
- [ ] **単体テストの拡充**: 現在テストは `rubyTextFormatter` にしか存在しません。`geminiService.ts` のコアロジックや、次に計画しているプロバイダーのテストを作成し、品質を向上させます。
- [ ] **設定項目の拡充**:
    - [ ] AIのモデルを選択できる機能（例: `gemini-1.5-pro`など）。
    - [ ] プロンプトをユーザーがカスタマイズできる機能。
- [ ] **`GEMINI.md` の更新**: 「安全性設定」「非同期」の項目が未記述のため、ドキュメントを更新します。
