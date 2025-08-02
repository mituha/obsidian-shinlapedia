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
意味(definition)よりフレーバーテキスト(flavorText)が適切な場合は、意味ではなくフレーバーテキストを記述してください。
意味、フレーバーテキストの項目は冗長になりすぎないように140文字以内で記述してください。
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
| `flavorText` | STRING | フレーバーテキストや補足情報 | |
| `etymology` | STRING | 語源 | |
| `examples` | ARRAY[OBJECT] | 例文の配列 | |
| `examples.sentence` | STRING | 例文の文 | ✅ |
| `examples.source` | STRING | 例文の出典 | |
| `synonyms` | ARRAY[STRING] | 類義語の配列 | |
| `antonyms` | ARRAY[STRING] | 対義語の配列 | |
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
