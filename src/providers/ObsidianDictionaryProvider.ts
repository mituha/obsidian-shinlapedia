// src/providers/ObsidianDictionaryProvider.ts
import { App, TFile, MarkdownView } from 'obsidian';
import { DictionaryProvider } from './DictionaryProvider';
import { ShinLapediaPluginSettings } from '../shinLapediaSettings';

export class ObsidianDictionaryProvider implements DictionaryProvider {
    private app: App;
    private settings: ShinLapediaPluginSettings;

    constructor(app: App, settings: ShinLapediaPluginSettings) {
        this.app = app;
        this.settings = settings;
    }
    getBookFolder(): string  {
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

    async getWordDetail(word: string): Promise<string | null> {
        const folderPath = this.getBookFolder();
        //現状、同一のファイル名(単語)はない想定での構造
        const files = this.app.vault.getMarkdownFiles();
        //単語の一致するファイルを取得
        const matchingFiles = files.filter(file => file.path.startsWith(folderPath) && file.basename === word);
        if(matchingFiles.length === 0) {
            return null; // ファイルが見つからない場合はnullを返す
        }
        // ここで最初の一致するファイルを取得
        const file = matchingFiles.first();
        if (file instanceof TFile) {
            return this.app.vault.read(file);
        }
        return null;
    }

    async getActiveFileContent(): Promise<string | null> {
        //メインのエディター部分でのアクティブなleafを確認
        // ルートスプリットの最新のleafを取得
        const rootLeaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
        const activeView = rootLeaf?.view as MarkdownView;
        if (activeView) {
            return activeView.editor.getValue();
        }
        return null;
    }
}
