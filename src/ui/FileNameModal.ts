import { App, Modal, Setting, Notice } from 'obsidian';
import { ShinLapediaPluginSettings } from '../shinLapediaSettings';

export class FileNameModal extends Modal {
    fileName: string;
    overwrite: boolean;
    settings: ShinLapediaPluginSettings;
    onSubmit: (fileName: string, overwrite: boolean) => void;

    constructor(app: App, settings: ShinLapediaPluginSettings, onSubmit: (fileName: string, overwrite: boolean) => void) {
        super(app);
        this.settings = settings;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: '新しい単語を作成' });

        new Setting(contentEl)
            .setName('単語')
            .addText((text) => {
                text.onChange((value) => {
                    this.fileName = value;
                });
                text.inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.submitForm();
                    }
                });
            });
        new Setting(contentEl)
            .setName('更新を許可する')
            .addToggle((toggle) => {
                toggle.onChange((value) => {
                    this.overwrite = value;
                });
            });

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('作成')
                    .setCta()
                    .onClick(() => {
                        this.submitForm();
                    })
            );
    }

    submitForm() {
        if (this.fileName) {
            this.onSubmit(this.fileName, this.overwrite);
            this.close();
        } else {
            new Notice('単語を入力してください。');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
