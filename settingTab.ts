import { App, PluginSettingTab, Setting } from 'obsidian';
import ShinLapediaPlugin from './main';

export class SampleSettingTab extends PluginSettingTab {
	plugin: ShinLapediaPlugin;

	constructor(app: App, plugin: ShinLapediaPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

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
	}
}
