import { TFile } from "obsidian";

// src/providers/DictionaryProvider.ts
export interface DictionaryProvider {

    /**
     * 辞典の書籍フォルダのパスを取得します。
     * @returns 書籍フォルダのパス
     */
    getBookFolder(): string;

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

    /**
     * 新しい単語ファイルを作成します。
     * @param word 作成する単語名
     * @returns 処理の成功有無とメッセージを含むオブジェクト
     */
    createWord(word: string): Promise<{ success: boolean; message: string }>;

    /**
     * 単語ファイルを更新します。
     * @param file 更新する単語ファイル
     * @returns 処理の成功有無
     */
    updateWordFile(file: TFile): Promise<void>;
}
