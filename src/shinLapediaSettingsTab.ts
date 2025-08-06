import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import ShinLapediaPlugin from './main';
import { testConnection } from './services/geminiService';

export class ShinLapediaSettingsTab extends PluginSettingTab {
	plugin: ShinLapediaPlugin;

	constructor(app: App, plugin: ShinLapediaPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
				.setName('Google Gemini API Key')
				.setDesc('Google AI Studioで取得したAPIキーを入力してください。')
			.addText(text => text
				.setPlaceholder('Enter your Gemini API Key')
				.setValue(this.plugin.settings.geminApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminApiKey = value;
					await this.plugin.saveSettings();
				}));


			// Geminiモデル選択ドロップダウン
			const modelSetting = new Setting(containerEl)
				.setName('Gemini AI Model')
				.setDesc('使用するAIモデルを選択してください。カスタムを選択すると、任意のモデル名を入力できます。');

			modelSetting.addDropdown(dropdown => {
				dropdown
					.addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (推奨)')
					.addOption('gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite')
					.addOption('gemini-2.5-pro', 'Gemini 2.5 Pro')
					.addOption('gemini-2.0-flash', 'Gemini 2.0 Flash')
					.addOption('gemini-2.0-flash-lite', 'Gemini 2.0 Flash Lite')
					.addOption('custom', 'カスタム')
					.setValue(this.plugin.settings.geminiModel)
					.onChange(async (value) => {
						this.plugin.settings.geminiModel = value;
						await this.plugin.saveSettings();
						// 変更を反映するためにUIを再描画
						this.display();
					});
			});

			// カスタムモデル入力用のテキストボックス
			if (this.plugin.settings.geminiModel === 'custom') {
				new Setting(containerEl)
					.setName('カスタムモデル名')
					.setDesc('使用したいモデルの正確な名前を入力してください。（例: models/gemini-1.5-pro-latest）')
					.addText(text => text
						.setPlaceholder('Enter custom model name')
						.setValue(this.plugin.settings.customGeminiModel)
						.onChange(async (value) => {
							this.plugin.settings.customGeminiModel = value;
							await this.plugin.saveSettings();
						}));
			}


			// 接続テストボタン
			new Setting(containerEl)
				.setName('接続テスト')
				.setDesc('入力されたAPIキーと選択されたモデルで、Gemini APIへの接続をテストします。')
				.addButton(button => {
					button
						.setButtonText('テスト実行')
						.onClick(async () => {
							const apiKey = this.plugin.settings.geminApiKey;
							const model = this.plugin.settings.geminiModel === 'custom' 
								? this.plugin.settings.customGeminiModel 
								: this.plugin.settings.geminiModel;

							if (!model) {
								new Notice('テストするモデルが選択または入力されていません。');
								return;
							}

							button.setButtonText('テスト中...').setDisabled(true);
							const result = await testConnection(apiKey, model);
							button.setButtonText('テスト実行').setDisabled(false);

							if (result.success) {
								new Notice('✅ 接続に成功しました！');
							} else {
								new Notice(`❌ 接続に失敗しました。\nエラー: ${result.error}`);
							}
						});
				});


		//辞典用のフォルダーを制限する場合
		new Setting(containerEl)
			.setName('辞典用のフォルダー制限')
			.setDesc('辞典を保存するフォルダーを指定します')
			.addText(text => text
				.setPlaceholder('辞典を保存するフォルダーを入力')
				.setValue(this.plugin.settings.bookFolder)
				.onChange(async (value) => {
					this.plugin.settings.bookFolder = value;
					await this.plugin.saveSettings();
				}));
		//辞典の設定
		new Setting(containerEl)
			.setName('辞典の名前')
			.setDesc('作成する辞典の名前を入力してください')
			.addText(text => text
				.setPlaceholder('作成する辞典の名前を入力')
				.setValue(this.plugin.settings.bookTitle)
				.onChange(async (value) => {
					this.plugin.settings.bookTitle = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('辞典の説明')
			.setDesc('作成する辞典の説明を入力してください')
			.addTextArea(text => text
				.setPlaceholder('作成する辞典の説明を入力')
				.setValue(this.plugin.settings.bookDescription)
				.onChange(async (value) => {
					this.plugin.settings.bookDescription = value;
					await this.plugin.saveSettings();
				}));
		//著者の設定
		new Setting(containerEl)
			.setName('著者の名前')
			.setDesc('著者の名前を入力してください')
			.addText(text => text
				.setPlaceholder('著者の名前を入力')
				.setValue(this.plugin.settings.authorName)
				.onChange(async (value) => {
					this.plugin.settings.authorName = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('著者の説明')
			.setDesc('著者の説明を入力してください')
			.addTextArea(text => text
				.setPlaceholder('著者の説明を入力')
				.setValue(this.plugin.settings.authorDescription)
				.onChange(async (value) => {
					this.plugin.settings.authorDescription = value;
					await this.plugin.saveSettings();
				}));
	}
}
