import { GoogleGenAI, Type, Tool, Part, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { ShinLapediaPluginSettings } from "../shinLapediaSettings";
import { LexicalEntry } from "../models/lexicalEntry";
import { LexicalEntryFormatter } from "../formatters/lexicalEntryFormatter";
import { App, TFile } from "obsidian";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";
const GEMINI_TEXT_MODEL = "gemini-1.5-flash-latest";

let ai: GoogleGenAI | null = null;
let pluginSettings: ShinLapediaPluginSettings | null = null;
let app: App | null = null;

export const setApp = (obsidianApp: App) => {
    app = obsidianApp;
};

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

// --- Function Calling Tools ---

const getWordList = async (): Promise<{ words: string[] } > => {
    if (!app || !pluginSettings?.bookFolder) {
        console.warn("辞典フォルダが設定されていません。");
        return {words:[]};
    }
    const folderPath = pluginSettings.bookFolder;
    const files = app.vault.getMarkdownFiles();
    const wordList = files
        .filter(file => file.path.startsWith(folderPath + '/'))
        .map(file => file.basename);
    console.log("取得した単語リスト:", wordList);
    return { words: wordList };
};

const getWordDetail = async (word: string): Promise<string> => {
    if (!app || !pluginSettings?.bookFolder) {
        return "辞典フォルダが設定されていません。";
    }
    const filePath = `${pluginSettings.bookFolder}/${word}.md`;
    const file = app.vault.getAbstractFileByPath(filePath);
    if (file && file instanceof TFile) {
        const content = await app.vault.read(file);
        console.log(`単語「${word}」の内容を取得しました。`);
        return content;
    }
    console.warn(`単語「${word}」が見つかりません。`);
    return `単語「${word}」は辞典に見つかりませんでした。`;
};

const tools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "getWordList",
                description: "辞典に登録されているすべての単語の一覧を取得します。",
                parameters: {
                    type: Type.OBJECT,
                    properties: {},
                }
            },
            {
                name: "getWordDetail",
                description: "指定された単語の詳細な説明（ファイルの内容）を取得します。",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        word: {
                            type: Type.STRING,
                            description: "内容を取得したい単語名"
                        }
                    },
                    required: ["word"]
                }
            }
        ]
    }
];

const functionHandlers: { [key: string]: (...args: any[]) => Promise<any> } = {
    getWordList: () => getWordList(),
    getWordDetail: ({ word }: { word: string }) => getWordDetail(word),
};


// --- AI Interaction ---

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


export const generateChatResponse = async (userInput: string, context: string): Promise<string> => {
    if (!checkApiKey() || !ai || !pluginSettings) throw new Error(API_KEY_ERROR_MESSAGE);

    let basePrompt = `あなたは博識な辞典の編纂者です。ユーザーと対話してください。`;

    if (pluginSettings.authorName) {
        basePrompt = `あなたは辞典の編纂者「${pluginSettings.authorName}」です。`;
        if (pluginSettings.authorDescription) {
            basePrompt += `\nあなたの設定: ${pluginSettings.authorDescription}。`;
        }
        basePrompt += `\nこの設定になりきって、ユーザーと対話してください。`;
    }

    if (pluginSettings.bookTitle) {
        basePrompt += `\nあなたは辞典「${pluginSettings.bookTitle}」を編纂しています。`;
        if (pluginSettings.bookDescription) {
            basePrompt += `\n辞典の説明: ${pluginSettings.bookDescription}。`;
        }
    }
    basePrompt += "必要に応じて単語の登録状況を確認し、既存の単語の意味に沿うように回答してください。";
    basePrompt += "未登録、および既知の単語には[[単語]]の形でリンクを作成してください。";

    const history: Content[] = [
        { role: "user", parts: [{ text: basePrompt }] },
        { role: "model", parts: [{ text: "はい、編纂者です。どのようなご用件でしょうか？" }] }
    ];

    if (context) {
        history.push({ role: "user", parts: [{ text: `ユーザーは今「${context}」という単語のページを見ています。この文脈を踏まえて回答してください。` }] });
        history.push({ role: "model", parts: [{ text: "承知いたしました。文脈を考慮して回答します。" }] });
    }

    history.push({ role: "user", parts: [{ text: userInput }] });

    try {
        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: history,
            config: {
                tools: tools,
            }
        });
        let responsePart = result.candidates?.[0]?.content?.parts?.[0];
        if (!responsePart) {
            return "AIからの応答がありませんでした。";
        }
        let funcCalls = result.functionCalls;
        console.log("functionCalls:", funcCalls);

        while (funcCalls) {
            const { name, args } = responsePart.functionCall!;
            console.log(`Function Call: ${name}(${JSON.stringify(args)})`);

            const handler = functionHandlers[name!];
            if (!handler) {
                throw new Error(`Unknown function call: ${name}`);
            }

            const functionResult = await handler(args);

            history.push({ role: 'model', parts: [responsePart] });
            history.push({
                role: 'user',
                parts: [{
                    functionResponse: {
                        name,
                        response: {
                            content: functionResult
                        }
                    }
                }]
            });

            const result2 = await ai.models.generateContent({
                model: GEMINI_TEXT_MODEL,
                contents: history,
                config: {
                    tools: tools,
                }
            });

            responsePart = result2.candidates?.[0]?.content?.parts?.[0];
            if (!responsePart) {
                return "AIからの応答がありませんでした。";
            }
        }

        return responsePart.text || "AIからの応答がありませんでした。";

    } catch (error) {
        console.error("Error generating chat response from Gemini:", error);
        throw new Error("AIからの応答の生成に失敗しました。");
    }
};

