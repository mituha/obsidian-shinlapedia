* 生成AIは`@google/genai`を使用します。
    * https://ai.google.dev/gemini-api/docs/libraries?hl=ja
    * `@google/generative-ai`は使用しません。
        * `@google/generative-ai`に基づくコードは`@google/genai`用に修正してください。
    * AIからのレスポンスでJSONをパースする部分ではresponseSchemaを設定することでエラーが発生しない構造に変更してください
* プログラムを変更した場合、`docs/プラグイン仕様書.md`にも反映させてください。
    * 必要に応じて新たな仕様書を追加してください。
        * 例えば、AIからのレスポンスにJSONを用いるような複雑な処理の場合、そのプロンプトの意図や仕様、JSON形式等をまとめて仕様書として記述してください。
    * 仕様書のタイトル、内容は日本語を用いてください。
    