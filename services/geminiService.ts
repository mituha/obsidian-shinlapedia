
import { GoogleGenAI, GenerateContentResponse, Chat, GroundingMetadata } from "@google/genai";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";


let ai: GoogleGenAI | null = null;

export const initializeGeminiAI = (apiKey: string): void => {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
  }

  //暫定的にチャット用エージェントの開始
  startChat();
};

const checkApiKey = (): boolean => {
  if (!ai) {
    console.error(API_KEY_ERROR_MESSAGE);
    alert(API_KEY_ERROR_MESSAGE);
    return false;
  }
  return true;
};

let chatInstance: Chat | null = null;

export const startChat = (): void => {
    if (!checkApiKey() || !ai) return;
    if (!chatInstance) {
        chatInstance = ai.chats.create({
            model: GEMINI_TEXT_MODEL,
            config: {
                systemInstruction: 'あなたはぬいぐるみ系VTuber「げんじゃ」です。語尾に「わん」とつけます。フレンドリーかつ的確に回答してください。',
            },
        });
    }
};

export const sendMessageToChat = async (message: string): Promise<{text: string, groundingMetadata?: GroundingMetadata}> => {
    if (!checkApiKey() || !ai ) throw new Error(API_KEY_ERROR_MESSAGE);
    if (!chatInstance) {
        startChat(); // Ensure chat is initialized
        if (!chatInstance) throw new Error("チャットセッションの開始に失敗しました。");
    }
    
    const useGoogleSearch = message.toLowerCase().includes("最新情報") || message.toLowerCase().includes("ニュース");

    try {
        const response: GenerateContentResponse = await chatInstance.sendMessage({
            message: message,
            config: useGoogleSearch ? { tools: [{googleSearch: {}}] } : {}
        });

        return {
          text: response.text ?? "AIからの応答がありません。",
          groundingMetadata: response.candidates?.[0]?.groundingMetadata
        };
    } catch (error) {
        console.error("チャットメッセージ送信中にAIエラーが発生しました:", error);
        throw error;
    }
};
