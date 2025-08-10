import { App, MarkdownView, normalizePath, Notice, Plugin, TFile } from 'obsidian';
import { initializeGeminiAI, getWordDefinition } from './services/geminiService';
import { ShinLapediaPluginSettings, DEFAULT_SETTINGS } from './shinLapediaSettings';
import { ShinLapediaSettingsTab } from './shinLapediaSettingsTab';
import * as path from 'path';
import { FileNameModal } from './ui/FileNameModal';
import { applyRubyToElement } from './services/rubyTextFormatter';
import { ChatView } from './ui/ChatView';
import { ObsidianDictionaryProvider } from './providers/ObsidianDictionaryProvider';
import { DictionaryProvider } from './providers/DictionaryProvider';

export default class ShinLapediaPlugin extends Plugin {
	settings: ShinLapediaPluginSettings;
	dictionaryProvider: DictionaryProvider;

	async onload() {
		await this.loadSettings();

		// Providerの初期化
		this.dictionaryProvider = new ObsidianDictionaryProvider(this.app, this.settings);

		// AIサービスの初期化
		if (initializeGeminiAI(this.settings.geminApiKey, this.settings, this.dictionaryProvider)) {
			console.log('Gemini AI initialized with provided API key.');
		} else {
			console.warn('No valid Gemini API key found. AI features may not work as expected.');
		}

		this.registerView(
			ChatView.VIEW_TYPE,
			(leaf) => new ChatView(leaf, this)
		);

		this.addRibbonIcon(ChatView.VIEW_ICON, ChatView.VIEW_TITLE, () => {
			this.activateView();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		this.addCommand({
			id: 'open-shinlapedia-chat-view',
			name: '編纂者とチャット',
			callback: () => {
				this.activateView();
			}
		});

		this.addCommand({
			id: 'create-new-shinlapedia-entry',
			name: '新規単語作成',
			callback: () => {
				new FileNameModal(this.app, this.settings, (fileName, overwrite) => {
					this.createShinLapediaFile(fileName, overwrite);
				}).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ShinLapediaSettingsTab(this.app, this));

		//ファイル新規作成時のイベントを確認
		this.registerEvent(this.app.vault.on("create", async (file) => {
			console.log('File created:', file);
			// You can perform actions here, like initializing AI for the new file
			if (file instanceof TFile && file.extension === 'md') {
				//Obsidianを立ち上げた場合にも呼び出されているため、ファイルの内容が空の場合だけ処理をするべき
				if (file.stat.size > 0) {
					console.log(`ファイル ${file.path} は既に存在します。AIによる処理は行いません。`);
					return;
				}
				const bookFolder = this.dictionaryProvider.getBookFolder();
				if (bookFolder) {
					const filePath = path.dirname(file.path) + '/'; // ファイルのパスからフォルダーを取得
					console.log(`ファイルのフォルダー: ${filePath}`);
					if (!filePath.startsWith(bookFolder)) {
						console.log(`ファイル ${file.path} は指定されたフォルダー外にあります。AIによる処理は行いません。`);
						return;
					}
				}

				console.log(`新しいMarkdownファイルが作成されました: ${file.path}`);
				//処理に時間がかかるため、ユーザーに視覚的に通知
				try {
					document.body.style.cursor = 'wait';
					const notice = new Notice(`ファイル ${file.path} の内容をAIで生成しています...`);

					await this.dictionaryProvider.updateWordFile(file);

					//通知を消す
					notice.hide();
				} catch (error) {
					console.error(`ファイル ${file.path} の内容生成中にエラーが発生しました:`, error);
					new Notice(`ファイル ${file.path} の内容生成中にエラーが発生しました。コンソールを確認してください。`);
				} finally {
					document.body.style.cursor = 'auto'; // カーソルを元に戻す 'default'では駄目っぽい
				}
			}
		}));

		//ルビの表示
		this.registerMarkdownPostProcessor((element, context) => {
			applyRubyToElement(element);
		});

		/*
		//動作確認用に選択されているleafを確認
		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
			//このイベントはエリアの区別なく呼び出される。
			if (leaf) {
				console.log('Active leaf changed:', leaf);
				//通知でも表示
				new Notice(`アクティブなleafが変更されました: ${leaf.view.getDisplayText()}`);
			} else {
				console.log('No active leaf.');
				new Notice('No active leaf.');
			} 

			//メインのエディター部分でのアクティブなleafを確認
			// ルートスプリットの最新のleafを取得
			const rootLeaf = this.app.workspace.getMostRecentLeaf(this.app.workspace.rootSplit);
			if (rootLeaf) {
				console.log('Active root leaf:', rootLeaf);
				new Notice(`アクティブなルートleaf: ${rootLeaf.view.getDisplayText()}`);
			} else {
				console.log('No active root leaf.');
				new Notice('No active root leaf.');
			}
		}));
		*/
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(ChatView.VIEW_TYPE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createShinLapediaFile(fileName: string, overwrite: boolean) {
		console.log(`Creating ShinLapedia file: ${fileName},overwrite=${overwrite}`);

		if (!fileName.endsWith('.md')) {
			fileName += '.md';
		}

		let filePath = fileName;
		const bookFolder = this.dictionaryProvider.getBookFolder();
		if (bookFolder) {
			//ここで区切り文字が\に変わっている
			filePath = path.join(bookFolder, fileName);
		}
		console.log(`ファイルパス: ${filePath}`);
		filePath = normalizePath(filePath); // Obsidianのパス形式に正規化
		console.log(`ファイルパス: ${filePath}`);

		// ファイルが存在するかチェックするわん
		const fileExists = await this.app.vault.adapter.exists(filePath);
		console.log(`ファイル '${filePath}' の存在確認: ${fileExists}`);

		if (fileExists) {
			//getAbstractFileByPathがうまく動作しない？ object？を返す
			//this.app.vault.getAbstractFileByPath(filePath);
			const existingFile = this.app.vault.getFileByPath(filePath);
			console.log(`既存のファイル:`, existingFile);
			if (existingFile) {
				if (overwrite) {
					console.log(`ファイル '${existingFile.path}' を更新します。`);

					//処理に時間がかかるため、ユーザーに視覚的に通知
					try {
						document.body.style.cursor = 'wait';
						const notice = new Notice(`ファイル ${existingFile.path} の内容をAIで生成しています...`);

						await this.dictionaryProvider.updateWordFile(existingFile);

						//通知を消す
						notice.hide();
					} catch (error) {
						console.error(`ファイル ${existingFile.path} の内容生成中にエラーが発生しました:`, error);
						new Notice(`ファイル ${existingFile.path} の内容生成中にエラーが発生しました。コンソールを確認してください。`);
					} finally {
						document.body.style.cursor = 'auto'; // カーソルを元に戻す 'default'では駄目っぽい
					}

				}else {
					console.warn(`わん！ファイル '${filePath}' は既に存在するわん。既存のファイルを開くわん。`);
				}
				this.app.workspace.getLeaf(true).openFile(existingFile);
			}else{
				console.warn(`わん！ファイル '${filePath}' は既に存在するが、TFileではないわん。処理を中止するわん。`); // 例えばフォルダなどの可能性があるわん
			}
			return; // 処理を終了するわん
		}
		try {
			const file = await this.app.vault.create(filePath, '');
			this.app.workspace.getLeaf(true).openFile(file);
		} catch (error) {
			new Notice(`Error creating file: ${error}`);
			console.error(`Error creating file:`, error);
		}
	}

	async activateView() {
		this.app.workspace.detachLeavesOfType(ChatView.VIEW_TYPE);

		await this.app.workspace.getRightLeaf(false)?.setViewState({
			type: ChatView.VIEW_TYPE,
			active: true,
		});

		this.app.workspace.revealLeaf(
			this.app.workspace.getLeavesOfType(ChatView.VIEW_TYPE)[0]
		);
	}
}