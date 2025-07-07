import { GoogleGenAI } from "@google/genai";
import { ShinLapediaPluginSettings } from "../shinLapediaSettings";
import { LexicalEntry } from "../models/lexicalEntry";
import { LexicalEntryFormatter } from "formatters/lexicalEntryFormatter";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;
let pluginSettings: ShinLapediaPluginSettings | null = null;

export const initializeGeminiAI = (apiKey: string, settings: ShinLapediaPluginSettings): void => {
    if (!apiKey || apiKey.trim() === "") {
        //APIキーが設定されていない場合、環境変数からの取得を試みる。
        apiKey = process.env.GEMINI_API_KEY || '';
    }
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey: apiKey });
        pluginSettings = settings;
    }
};

const checkApiKey = (): boolean => {
    if (!ai) {
        console.error(API_KEY_ERROR_MESSAGE);
        alert(API_KEY_ERROR_MESSAGE);
        return false;
    }
    return true;
};

export const getLexicalEntry = async (word: string): Promise<LexicalEntry> => {
    if (!checkApiKey() || !ai || !pluginSettings) throw new Error(API_KEY_ERROR_MESSAGE);

    try {
        let prompt = `あなたは辞典の編纂者です`;

        prompt += `\n「${word}」について、以下のJSONスキーマに従って日本語で詳細な語彙情報を生成してください。`;

        if (pluginSettings.bookTitle) {
            prompt += `\n 辞典「${pluginSettings.bookTitle}」の文脈で説明してください。`;
        }
        if (pluginSettings.bookDescription) {
            prompt += `\n 辞典の説明: ${pluginSettings.bookDescription}。`;
        }
        if (pluginSettings.authorName) {
            prompt += `\n 編纂者「${pluginSettings.authorName}」の視点から説明してください。`;
        }
        if (pluginSettings.authorDescription) {
            prompt += `\n 編纂者の説明: ${pluginSettings.authorDescription}。`;
        }
        //TODO 架空度合いを追加する？
        prompt += `\n\n独自の意味以外に一般的な意味がある場合はわかるように併記してください。`;

        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: LexicalEntry.getJSONSchema()
            }
        });

        const response = result.text ?? "{}"; // デフォルト値を空のJSON文字列に設定
        const jsonResponse = JSON.parse(response);

        return LexicalEntry.fromJSON(jsonResponse);
    } catch (error) {
        console.error(`単語「${word}」の語彙情報取得中にAIエラーが発生しました:`, error);
        throw error;
    }
};

export const getWordDefinition = async (word: string): Promise<string> => {
    const entry = await getLexicalEntry(word);
    return LexicalEntryFormatter.toMarkdown(entry);
};
