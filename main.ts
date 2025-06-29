import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile } from 'obsidian';
import { initializeGeminiAI , getWordDefinition } from './services/geminiService'; // Import the function to initialize Gemini AI
import { ShinLapediaPluginSettings, DEFAULT_SETTINGS } from './shinLapediaSettings';
import { ShinLapediaSettingsTab } from './shinLapediaSettingsTab';

export default class ShinLapediaPlugin extends Plugin {
	settings: ShinLapediaPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ShinLapediaSettingsTab(this.app, this));

		//ファイル新規作成時のイベントを確認
		this.registerEvent(this.app.vault.on("create",async (file) => {
			console.log('File created:', file);
			// You can perform actions here, like initializing AI for the new file
			if (file instanceof TFile && file.extension === 'md') {
				//Obsidianを立ち上げた場合にも呼び出されているため、ファイルの内容が空の場合だけ処理をするべき
				if(file.stat.size > 0) {
					console.log(`ファイル ${file.path} は既に存在します。AIによる処理は行いません。`);
					return;
				}
                console.log(`新しいMarkdownファイルが作成されました: ${file.path}`);
				//処理に時間がかかるため、ユーザーに視覚的に通知
				try{
					document.body.style.cursor = 'wait';
					const notice = new Notice(`ファイル ${file.path} の内容をAIで生成しています...`);

					//ファイルは空の前提
					const  definition = await getWordDefinition(file.basename);
					//追記を使用するが、ファイルは空の前提なので、内容は上書きされる。
					await this.app.vault.append(file,`${definition}\n`);
					console.log(`ファイル ${file.path} に内容を追加しました。`);

					//通知を消す
					notice.hide();
				}catch(error){
					console.error(`ファイル ${file.path} の内容生成中にエラーが発生しました:`, error);
					new Notice(`ファイル ${file.path} の内容生成中にエラーが発生しました。コンソールを確認してください。`);
				}finally{
					document.body.style.cursor = 'auto'; // カーソルを元に戻す 'default'では駄目っぽい
				}
			}
		}));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		//APIキーがある場合、AIエージェントの初期化を行う。
		if (this.settings.geminApiKey && this.settings.geminApiKey !== 'default') {
				initializeGeminiAI(this.settings.geminApiKey, this.settings);
				console.log('Gemini AI initialized with provided API key.');
		} else {
			console.warn('No valid Gemini API key found. AI features may not work as expected.');
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}


