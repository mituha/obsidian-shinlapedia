import { GoogleGenAI } from "@google/genai";
import { ShinLapediaPluginSettings } from "../shinLapediaSettings";
import { LexicalEntry } from "../models/lexicalEntry";
import { LexicalEntryFormatter } from "../formatters/lexicalEntryFormatter";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;
let pluginSettings: ShinLapediaPluginSettings | null = null;

export const initializeGeminiAI = (apiKey: string, settings: ShinLapediaPluginSettings): boolean => {
    if (!apiKey || apiKey.trim() === "") {
        //APIキーが設定されていない場合、環境変数からの取得を試みる。
        apiKey = process.env.GEMINI_API_KEY || '';
    }
    if (!apiKey || apiKey.trim() === "") {
        return false;
    }
    ai = new GoogleGenAI({ apiKey: apiKey });
    pluginSettings = settings;
    return true;
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
        prompt += `\n\n基本的にこの辞典特有の意味を優先します。`;
        prompt += `\n\n一般的な意味がある場合はわかるように併記してください。`;
        prompt += `\n\n意味(definition)よりフレーバーテキスト(flavorText)が適切な場合は、意味ではなくフレーバーテキストを記述してください。`;
        prompt += `\n\n意味、フレーバーテキストの項目は冗長になりすぎないように140文字以内で記述してください。`;
        prompt += `\n\nルビを振る場合、 |漢字《かんじ》 の形式で記述してください。`;
        prompt += `\n\n現在の単語以外のこの辞典特有の固有単語には、 [固有単語](固有単語.md) の形式でリンクを記述してください。なお、リンク先にはルビを含めないでください。`;
        prompt += `\n\n類義語、対義語、関連語の項目のリンク記述は不要です。`;

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
