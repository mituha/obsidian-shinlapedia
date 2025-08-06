import { ItemView, WorkspaceLeaf, Notice ,MarkdownRenderer} from "obsidian";
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
    
	private async sendMessage() {
		const message = this.inputEl.value;
		if (!message.trim()) return;

		this.addMessage(message, "user");
		this.inputEl.value = "";

		try {
            document.body.style.cursor = 'wait';
            const notice = new Notice(`AIが応答を生成中です...`, 0);
			
            const response = await generateChatResponse(message);
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
		const messageContainer = this.chatContainer.createDiv({
			cls: `chat-message-container ${role}-message`,
		});

		const messageEl = messageContainer.createDiv({
			cls: `chat-message`,
		});

		if (role === 'model') {
			MarkdownRenderer.render(this.app, text, messageEl, '', this);
		} else {
			messageEl.setText(text);
		}

		const copyButton = messageContainer.createEl("button", {
			text: "コピー",
			cls: "chat-copy-button",
		});

		copyButton.addEventListener("click", () => {
			navigator.clipboard.writeText(text).then(() => {
				new Notice("メッセージをコピーしました");
			}, (err) => {
				console.error("Could not copy text: ", err);
				new Notice("コピーに失敗しました");
			});
		});

		this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
	}

	async onClose() {
		// Clean up any resources.
	}
}
