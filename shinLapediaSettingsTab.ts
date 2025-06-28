import { App, PluginSettingTab, Setting } from 'obsidian';
import ShinLapediaPlugin from './main';

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
			.setName('Gemini API Key')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your Gemini API Key')
				.setValue(this.plugin.settings.geminApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminApiKey = value;
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
