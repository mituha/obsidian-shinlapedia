// src/providers/ObsidianDictionaryProvider.ts
import { App, TFile, MarkdownView } from 'obsidian';
import { DictionaryProvider } from './DictionaryProvider';
import { ShinLapediaPluginSettings } from '../shinLapediaSettings';
import { getWordDefinition } from 'src/services/geminiService';

export class ObsidianDictionaryProvider implements DictionaryProvider {
    private app: App;
    private settings: ShinLapediaPluginSettings;

    constructor(app: App, settings: ShinLapediaPluginSettings) {
        this.app = app;
        this.settings = settings;
    }
    getBookFolder(): string {
        let bookFolder = this.settings.bookFolder || '';
        //フォルダパスの末尾にスラッシュがない場合は追加
        if (bookFolder && !bookFolder.endsWith('/')) {
            bookFolder += '/';
        }
        return bookFolder;
    }
    async getWordList(): Promise<string[]> {
        const folderPath = this.getBookFolder();

        //現状、同一のファイル名(単語)はない想定での構造
        const files = this.app.vault.getMarkdownFiles();
        return files
            .filter(file => file.path.startsWith(folderPath))
            .map(file => file.basename);
    }
    getWordFile(word: string): TFile | null {
        const folderPath = this.getBookFolder();
        //現状、同一のファイル名(単語)はない想定での構造
        const files = this.app.vault.getMarkdownFiles();
        //単語の一致するファイルを取得
        const matchingFiles = files.filter(file => file.path.startsWith(folderPath) && file.basename === word);
        if (matchingFiles.length === 0) {
            return null; // ファイルが見つからない場合はnullを返す
        }
        // ここで最初の一致するファイルを取得
        return matchingFiles.first() as TFile;
    }

    async getWordDetail(word: string): Promise<string | null> {
        // ここで最初の一致するファイルを取得
        const file = this.getWordFile(word);
        if (!file) {
            return null;
        }
        return this.app.vault.read(file);
    }

    async getActiveFileContent(): Promise<string | null> {
        //メインのエディター部分でのアクティブなleafを確認
        // ルートスプリットの最新のleafを取得
        //リンクによる新規ファイル作成時でも呼び出し元となるリーフの取得が出来る模様。
        //  なお、そのタイミングではリーフは作成された新規リーフ(fileは空)と呼び出し元のリーフが列挙可能。
        const rootLeaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const activeView = rootLeaf?.view as MarkdownView;
        if (activeView) {
            return activeView.editor.getValue();
        }
        return null;
    }

    async createWord(word: string): Promise<{ success: boolean; message: string }> {
        //既に同じ名前のファイルが存在する場合、何もしない
        if (this.getWordFile(word)) {
            return { success: false, message: `ファイル「${word}」は既に存在します。` };
        }
        const folderPath = this.getBookFolder();
        const fileName = word.endsWith('.md') ? word : `${word}.md`;
        const filePath = `${folderPath}${fileName}`;

        try {
            const fileExists = await this.app.vault.adapter.exists(filePath);
            if (fileExists) {
                return { success: false, message: `ファイル「${word}」は既に存在します。` };
            }

            // 空のファイルを作成
            const file = await this.app.vault.create(filePath, '');

            return { success: true, message: `単語「${word}」を登録しました。内容は自動生成されます。` };

        } catch (error) {
            console.error(`ファイル作成エラー: ${word}`, error);
            return { success: false, message: `単語「${word}」の登録中にエラーが発生しました。` };
        }
    }
    async updateWordFile(file: TFile): Promise<void> {
        //呼び出し元は何パターンかある。
        // 1. リンクによるアクティブなMarkdownファイルからの新規作成での呼び出し
        // 2. 特定のファイルを指定しての呼び出し
        // 3. 新規作成時の呼び出し
        if (file.extension !== 'md') {
            // 拡張子がmdでない場合の処理
            return;
        }
        const update = file.stat.size > 0; // ファイルが空でない場合は更新するわん

        //呼び出し元、もしくは、編集中の情報
        const dependentContent = await this.getActiveFileContent();

        //更新時用にこのファイルの内容を取得
        //単語情報作成時に一旦単語情報を取得するため、この処理は不要(内部的に呼ばれることになる)。
        //const currentContent = file.stat.size ? await this.app.vault.read(file) : '';

        //ファイルは空、もしくは、書き換える
        const definition = await getWordDefinition(file.basename, dependentContent || "");
        //追記を使用するが、ファイルは空の前提なので、内容は上書きされる。
        await this.app.vault.modify(file, `${definition}\n`);
        if (update) {
            console.log(`ファイル ${file.path} の内容を更新しました。`);
        } else {
            console.log(`ファイル ${file.path} の内容を新規作成しました。`);
        }
    }
}
