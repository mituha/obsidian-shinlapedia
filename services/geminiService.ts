import { GoogleGenAI, Chat } from "@google/genai";
import { ShinLapediaPluginSettings } from "../shinLapediaSettings";
import { LexicalEntry } from "../models/lexicalEntry";
import { v4 as uuidv4 } from 'uuid';

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;
let pluginSettings: ShinLapediaPluginSettings | null = null;

export const initializeGeminiAI = (apiKey: string, settings: ShinLapediaPluginSettings): void => {
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
        let prompt = `「${word}」について、以下のJSONスキーマに従って日本語で詳細な語彙情報を生成してください。`;

        if (pluginSettings.bookTitle) {
            prompt += ` 辞書「${pluginSettings.bookTitle}」の文脈で説明してください。`;
        }
        if (pluginSettings.bookDescription) {
            prompt += ` 辞書の説明: ${pluginSettings.bookDescription}。`;
        }
        if (pluginSettings.authorName) {
            prompt += ` 著者「${pluginSettings.authorName}」の視点から説明してください。`;
        }
        if (pluginSettings.authorDescription) {
            prompt += ` 著者の説明: ${pluginSettings.authorDescription}。`;
        }

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

        return new LexicalEntry(
            uuidv4(),
            jsonResponse.lemma,
            jsonResponse.partOfSpeech,
            jsonResponse.definitions,
            {
                reading: jsonResponse.reading,
                examples: jsonResponse.examples,
                synonyms: jsonResponse.synonyms,
                antonyms: jsonResponse.antonyms,
                tags: jsonResponse.tags,
            }
        );
    } catch (error) {
        console.error(`単語「${word}」の語彙情報取得中にAIエラーが発生しました:`, error);
        throw error;
    }
};

export const getWordDefinition = async (word: string): Promise<string> => {
    if (!checkApiKey() || !ai || !pluginSettings) throw new Error(API_KEY_ERROR_MESSAGE);

    try {
        let prompt = `「${word}」の意味を教えてください。`;

        if (pluginSettings.bookTitle) {
            prompt += ` 辞書「${pluginSettings.bookTitle}」の文脈で説明してください。`;
        }
        if (pluginSettings.bookDescription) {
            prompt += ` 辞書の説明: ${pluginSettings.bookDescription}。`;
        }
        if (pluginSettings.authorName) {
            prompt += ` 著者「${pluginSettings.authorName}」の視点から説明してください。`;
        }
        if (pluginSettings.authorDescription) {
            prompt += ` 著者の説明: ${pluginSettings.authorDescription}。`;
        }

        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        const response = result;
        return response.text ?? "単語の意味が見つかりませんでした。";
    } catch (error) {
        console.error(`単語「${word}」の意味取得中にAIエラーが発生しました:`, error);
        throw error;
    }
};
