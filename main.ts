import { App, MarkdownView, Modal, Notice, Plugin, TFile, Setting } from 'obsidian';
import { initializeGeminiAI, getWordDefinition } from './services/geminiService'; // Import the function to initialize Gemini AI
import { ShinLapediaPluginSettings, DEFAULT_SETTINGS } from './shinLapediaSettings';
import { ShinLapediaSettingsTab } from './shinLapediaSettingsTab';
import * as path from 'path';
import { FileNameModal } from './ui/FileNameModal';

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

		this.addCommand({
			id: 'create-new-shinlapedia-entry',
			name: '新規単語作成',
			callback: () => {
				new FileNameModal(this.app, this.settings, (fileName) => {
					this.createShinLapediaFile(fileName);
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
				if (this.settings.bookFolder) {
					let bookFolder = this.settings.bookFolder;
					if (!bookFolder.endsWith('/')) {
						bookFolder += '/'; // フォルダーのパスがスラッシュで終わっていない場合、追加する					
					}
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

					//ファイルは空の前提
					const definition = await getWordDefinition(file.basename);
					//追記を使用するが、ファイルは空の前提なので、内容は上書きされる。
					await this.app.vault.append(file, `${definition}\n`);
					console.log(`ファイル ${file.path} に内容を追加しました。`);

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
		console.log('ルビの表示を登録するわん！');
		this.registerMarkdownPostProcessor((element, context) => {
			console.log('ルビの表示を開始するわん！');
			// element は現在処理しているDOM要素だわん
            // context は要素のパスなど、追加情報を持つオブジェクトだわん

            // element内のテキストノードを走査して、ルビのパターンを探すわん
            // TextNodeはelement.childNodesの中に含まれるわん
            const textNodes = element.querySelectorAll('div,p, li, h1, h2, h3, h4, h5, h6, span'); // ルビを適用したい要素を指定するわん
			console.log('ルビの適用を開始するわん！', textNodes);
			if (textNodes.length === 0) { return; } // 対象の要素がなければ何もしないわん

            textNodes.forEach(node => {
                const textContent = node.textContent;
                if (!textContent){ return; } // テキストコンテンツがなければ何もしないわん
				console.log('ルビの適用対象のテキスト:', textContent);
				
                // カクヨム形式のルビの正規表現だわん
                // |漢字《ルビ》
                // `|` のエスケープと、`《》` のエスケープを忘れずにね
                const regex = /\|([^《》]+)《([^》]+)》/g;

                // 正規表現にマッチする部分があるかチェックするわん
                if (regex.test(textContent)) {
					console.log('ルビのパターンにマッチしたわん！', textContent);
                    // マッチした場合、新しいHTML要素を生成して置き換えるわん
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;

                    while ((match = regex.exec(textContent)) !== null) {
                        // ルビではない通常のテキスト部分を追加するわん
                        if (match.index > lastIndex) {
                            fragment.appendChild(document.createTextNode(textContent.substring(lastIndex, match.index)));
                        }

                        // ルビ部分をHTMLの <ruby> <rt> 要素で作成するわん！
                        const baseText = match[1]; // 漢字部分だわん
                        const rubyText = match[2]; // ルビ部分だわん

                        const rubyEl = document.createElement('ruby');
                        rubyEl.appendChild(document.createTextNode(baseText)); // 漢字（親文字）
                        const rtEl = document.createElement('rt');
                        rtEl.appendChild(document.createTextNode(rubyText)); // ルビ
                        rubyEl.appendChild(rtEl);

                        fragment.appendChild(rubyEl); // フラグメントに追加するわん
                        lastIndex = regex.lastIndex; // 次のマッチの開始位置を更新するわん
                    }

                    // 最後の残りのテキストを追加するわん
                    if (lastIndex < textContent.length) {
                        fragment.appendChild(document.createTextNode(textContent.substring(lastIndex)));
                    }

                    // 元のテキストノードを、新しく作成したHTMLフラグメントで置き換えるわん
                    node.replaceWith(fragment);
                }
            });
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		//APIキーがある場合、AIエージェントの初期化を行う。
		if (initializeGeminiAI(this.settings.geminApiKey, this.settings)) {
			console.log('Gemini AI initialized with provided API key.');
		} else {
			console.warn('No valid Gemini API key found. AI features may not work as expected.');
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createShinLapediaFile(fileName: string) {
		if (!fileName.endsWith('.md')) {
			fileName += '.md';
		}

		let filePath = fileName;
		if (this.settings.bookFolder) {
			filePath = path.join(this.settings.bookFolder, fileName);
		}

		// ファイルが存在するかチェックするわん
		const fileExists = await this.app.vault.adapter.exists(filePath);

		if (fileExists) {
			console.warn(`わん！ファイル '${filePath}' は既に存在するわん。既存のファイルを開くわん。`);
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile instanceof TFile) {
				this.app.workspace.getLeaf('tab').openFile(existingFile);
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
}


