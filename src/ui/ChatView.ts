import { ItemView, WorkspaceLeaf,MarkdownView, Notice ,MarkdownRenderer} from "obsidian";
import ShinLapediaPlugin from "../main";
import { GoogleGenAI } from "@google/genai";
import { generateChatResponse } from '../services/geminiService';

export const CHAT_VIEW_TYPE = "shinlapedia-chat-view";

export class ChatView extends ItemView {
	private plugin: ShinLapediaPlugin;
	private chatContainer: HTMLDivElement;
	private inputEl: HTMLInputElement;
    private sendButton: HTMLButtonElement;

	constructor(leaf: WorkspaceLeaf, plugin: ShinLapediaPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return CHAT_VIEW_TYPE;
	}

	getDisplayText() {
		return "ShinLapedia Chat";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		const viewContent = container.createDiv({ cls: "shinlapedia-chat-view" });

		this.chatContainer = viewContent.createDiv({ cls: "chat-messages" });

		const inputContainer = viewContent.createDiv({ cls: "chat-input-container" });
		this.inputEl = inputContainer.createEl("input", {
			type: "text",
			placeholder: "メッセージを送信...",
		});
		this.sendButton = inputContainer.createEl("button", { text: "送信" });

		this.sendButton.addEventListener("click", () => this.sendMessage());
		this.inputEl.addEventListener("keydown", (event) => {
			if (event.key === "Enter") {
				this.sendMessage();
			}
		});
	}
    private getCurrentContext(): string {
        const allMarkdownLeaves: WorkspaceLeaf[] = this.app.workspace.getLeavesOfType('markdown');
        const firstMarkdownView = allMarkdownLeaves[0]?.view as MarkdownView | undefined;
        const activeView = firstMarkdownView || this.app.workspace.getActiveViewOfType(MarkdownView);
        return activeView ? activeView.editor.getValue() : '';
    }
	private async sendMessage() {
		const message = this.inputEl.value;
		if (!message.trim()) return;

		this.addMessage(message, "user");
		this.inputEl.value = "";

		try {
            document.body.style.cursor = 'wait';
            const notice = new Notice(`AIが応答を生成中です...`, 0);
			

            const editorContent = this.getCurrentContext();
            const response = await generateChatResponse(message, editorContent);
			this.addMessage(response, "model");

			notice.hide();
		} catch (error) {
			console.error("Error sending message to Gemini:", error);
			new Notice("AIとの通信中にエラーが発生しました。");
			this.addMessage("エラーが発生しました。", "model");
		}finally {
            this.inputEl.disabled = false;
            this.sendButton.disabled = false;
            document.body.style.cursor = 'auto';
            this.inputEl.focus();
        }
	}

	private addMessage(text: string, role: "user" | "model") {
		const messageEl = this.chatContainer.createDiv({
			cls: `chat-message ${role}-message`,
		});
		
		if (role === 'model') {
			MarkdownRenderer.render(this.app,text,messageEl,'',this);
		} else {
			messageEl.setText(text);
		}

		this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
	}

	async onClose() {
		// Clean up any resources.
	}
}
