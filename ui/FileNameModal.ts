import { App, Modal, Setting, Notice } from 'obsidian';
import { ShinLapediaPluginSettings } from '../shinLapediaSettings';

export class FileNameModal extends Modal {
    fileName: string;
    settings: ShinLapediaPluginSettings;
    onSubmit: (fileName: string) => void;

    constructor(app: App, settings: ShinLapediaPluginSettings, onSubmit: (fileName: string) => void) {
        super(app);
        this.settings = settings;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: '新しいファイルを作成' });

        new Setting(contentEl)
            .setName('ファイル名')
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
            this.onSubmit(this.fileName);
            this.close();
        } else {
            new Notice('ファイル名を入力してください。');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
