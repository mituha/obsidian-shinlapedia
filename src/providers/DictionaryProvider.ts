// src/providers/DictionaryProvider.ts
export interface DictionaryProvider {
    /**
     * 辞典に登録されているすべての単語の一覧を取得します。
     */
    getWordList(): Promise<string[]>;

    /**
     * 指定された単語の詳細な説明（ファイルの内容）を取得します。
     * @param word 内容を取得したい単語名
     * @returns ファイルの内容。見つからない場合はnullを返す。
     */
    getWordDetail(word: string): Promise<string | null>;

    /**
     * 現在アクティブなエディタのファイル内容を取得します。
     * @returns アクティブなファイルの内容。アクティブなファイルがない場合はnullを返す。
     */
    getActiveFileContent(): Promise<string | null>;
}
