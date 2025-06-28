import { GoogleGenAI } from "@google/genai";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

let ai: GoogleGenAI | null = null;

export const initializeGeminiAI = (apiKey: string): void => {
  if (apiKey) {
    try{
      ai = new GoogleGenAI({ apiKey: apiKey });
    }catch (error) {
      console.error("Gemini AIの初期化中にエラーが発生しました:", error);
      console.error('APIキー:', apiKey);
      alert("Gemini AIの初期化に失敗しました。APIキーを確認してください。");
      ai = null;
      throw error;
    }
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


export const getWordDefinition = async (word: string): Promise<string> => {
    if (!checkApiKey() || !ai) throw new Error(API_KEY_ERROR_MESSAGE);

    try {
        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: `「${word}」の意味を教えてください。`,
        });
        const response = result;
        return response.text ?? "単語の意味が見つかりませんでした。";
    } catch (error) {
        console.error(`単語「${word}」の意味取得中にAIエラーが発生しました:`, error);
        throw error;
    }
};
