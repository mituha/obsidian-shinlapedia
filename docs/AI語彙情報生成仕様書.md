# AIによる語彙情報生成仕様書

このドキュメントは、`geminiService.ts` の `getLexicalEntry` 関数におけるAIの動作、特にプロンプトと期待されるJSON出力に関する仕様を定義します。

## 概要

この機能は、ユーザーが指定した単語に基づき、GoogleのGemini APIを利用して構造化された語彙情報（`LexicalEntry`）をJSON形式で生成します。
AIは辞典の編纂者として振る舞い、単語の定義、読み、品詞、例文などを生成します。

## 実装

- **関数**: `getLexicalEntry(word: string): Promise<LexicalEntry>`
- **ファイル**: `src/services/geminiService.ts`
- **使用モデル**: `gemini-1.5-flash-latest`

## プロンプト設計

AIに与えられるプロンプトは、基本構造とユーザー設定に基づくオプション部分から構成されます。

### 基本プロンプト

```plaintext
あなたは辞典の編纂者です。
「{word}」について、以下のJSONスキーマに従って日本語で詳細な語彙情報を生成してください。

基本的にこの辞典特有の意味を優先します。
一般的な意味がある場合はわかるように併記してください。
意味(definitions)だけでは説明が難しい場合は解説(explanation)を記述してください。
意味(definition)よりフレーバーテキスト(flavorText)が適切な場合は、意味ではなくフレーバーテキストを記述してください。
意味、解説、フレーバーテキストの項目は冗長になりすぎないように140文字以内で記述してください。
この単語を閲覧した架空の人物によるコメントを2～3件生成してください。
コメント(comments)では、コメンテーターの個性や立場が反映された、世界観が広がるような内容を記述してください。
コメンテーターの名前(commenterName)は、その世界観に合った名前を設定してください。
使用者(あなた)が追記したプライベートなメモ(memos)を1～2件生成してください。
メモには、個人的な考察や未確認情報などを記述してください。
ルビを振る場合、 |漢字《かんじ》 の形式で記述してください。
現在の単語以外のこの辞典特有の固有単語には、 [固有単語](固有単語.md) の形式でリンクを記述してください。なお、リンク先にはルビを含めないでください。
類義語、対義語、関連語の項目のリンク記述は不要です。
```

- `{word}`: ユーザーが指定した単語に置き換えられます。

### オプション指示

プラグイン設定画面で以下の項目が設定されている場合、プロンプトに指示が追加されます。

- **辞典のタイトル (`bookTitle`)**:
  - `辞典「{bookTitle}」の文脈で説明してください。`
- **辞典の説明 (`bookDescription`)**:
  - `辞典の説明: {bookDescription}。`
- **編纂者名 (`authorName`)**:
  - `編纂者「{authorName}」の視点から説明してください。`
- **編纂者の説明 (`authorDescription`)**:
  - `編纂者の説明: {authorDescription}。`

## JSONレスポンス仕様

AIは `responseMimeType: "application/json"` と `responseSchema` を利用して、以下のスキーマに準拠したJSONを生成します。
このスキーマは `src/models/lexicalEntry.ts` の `LexicalEntry.getJSONSchema()` メソッドによって定義されています。

### スキーマ定義

| プロパティ名 | 型 | 説明 | 必須 |
| --- | --- | --- | --- |
| `lemma` | STRING | 見出し語 | ✅ |
| `reading` | STRING | 語の読み方や発音 | |
| `partOfSpeech` | STRING | 品詞 | ✅ |
| `definitions` | ARRAY[STRING] | 語の定義の配列 | ✅ |
| `explanation` | STRING | 単語の意味だけでは理解しづらい内容に対する解説 | |
| `flavorText` | STRING | フレーバーテキストや補足情報 | |
| `etymology` | STRING | 語源 | |
| `examples` | ARRAY[OBJECT] | 例文の配列 | |
| `examples.sentence` | STRING | 例文の文 | ✅ |
| `examples.source` | STRING | 例文の出典 | |
| `synonyms` | ARRAY[STRING] | 類義語の配列 | |
| `antonyms` | ARRAY[STRING] | 対義語の配列 | |
| `comments` | ARRAY[OBJECT] | 閲覧者によるコメントの配列 | |
| `comments.commenterName` | STRING | コメント投稿者の名前 | ✅ |
| `comments.commentText` | STRING | コメント本文 | ✅ |
| `comments.timestamp` | STRING | 投稿日時 (ISO 8601形式) | |
| `memos` | ARRAY[OBJECT] | 使用者によるプライベートなメモの配列 | |
| `memos.text` | STRING | メモ本文 | ✅ |
| `tags` | ARRAY[STRING] | タグやラベルの配列 | |

### スキーマ (JSON形式)

```json
{
    "type": "OBJECT",
    "properties": {
        "lemma": { "type": "STRING", "description": "見出し語" },
        "reading": { "type": "STRING", "description": "語の読み方や発音" },
        "partOfSpeech": { "type": "STRING", "description": "品詞" },
        "definitions": {
            "type": "ARRAY",
            "items": { "type": "STRING" },
            "description": "語の定義の配列"
        },
        "explanation": { "type": "STRING", "description": "単語の意味だけでは理解しづらい内容に対する解説" },
        "flavorText": { "type": "STRING", "description": "フレーバーテキストや補足情報" },
        "examples": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "sentence": { "type": "STRING" },
                    "source": { "type": "STRING" }
                },
                "required": ["sentence"]
            },
            "description": "例文"
        },
        "synonyms": {
            "type": "ARRAY",
            "items": { "type": "STRING" },
            "description": "類義語"
        },
        "antonyms": {
            "type": "ARRAY",
            "items": { "type": "STRING" },
            "description": "対義語"
        },
        "etymology": { "type": "STRING", "description": "語源" },
        "comments": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "commenterName": { "type": "STRING", "description": "コメント投稿者の名前" },
                    "commentText": { "type": "STRING", "description": "コメント本文" },
                    "timestamp": { "type": "STRING", "description": "投稿日時 (ISO 8601形式)" }
                },
                "required": ["commenterName", "commentText"]
            },
            "description": "閲覧者によるコメントの配列"
        },
        "memos": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "text": { "type": "STRING", "description": "メモ本文" }
                },
                "required": ["text"]
            },
            "description": "使用者によるプライベートなメモの配列"
        },
        "tags": {
            "type": "ARRAY",
            "items": { "type": "STRING" },
            "description": "タグやラベル"
        }
    },
    "required": ["lemma", "partOfSpeech", "definitions"]
}
```

生成されたJSONは `LexicalEntry.fromJSON()` メソッドによって `LexicalEntry` クラスのインスタンスに変換され、後続の処理で使用されます。