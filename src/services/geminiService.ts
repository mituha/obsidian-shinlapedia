import { GoogleGenAI, Type, Tool, Content, GenerateContentConfig, ListTuningJobsResponse, FunctionDeclaration } from "@google/genai";
import { ShinLapediaPluginSettings } from "../shinLapediaSettings";
import { LexicalEntry } from "../models/lexicalEntry";
import { LexicalEntryFormatter } from "../formatters/lexicalEntryFormatter";
import { DictionaryProvider } from "../providers/DictionaryProvider";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49";

const API_KEY_ERROR_MESSAGE = "Gemini APIキーが設定されていません。";

let ai: GoogleGenAI | null = null;
let pluginSettings: ShinLapediaPluginSettings | null = null;
let dictionaryProvider: DictionaryProvider | null = null;

export const initializeGeminiAI = (
    apiKey: string,
    settings: ShinLapediaPluginSettings,
    provider: DictionaryProvider
): boolean => {
    if (!apiKey || apiKey.trim() === "") {
        apiKey = process.env.GEMINI_API_KEY || '';
    }
    if (!apiKey || apiKey.trim() === "") {
        return false;
    }
    ai = new GoogleGenAI({ apiKey: apiKey });
    pluginSettings = settings;
    dictionaryProvider = provider;
    return true;
};

const checkApiKey = (): boolean => {
    if (!ai || !dictionaryProvider) {
        const message = !ai ? API_KEY_ERROR_MESSAGE : "DictionaryProviderが初期化されていません。";
        console.error(message);
        alert(message);
        return false;
    }
    return true;
};

/**
 * 現在アクティブなGeminiモデル名を取得します。
 * カスタムモデルが設定されていればそれを、なければ標準のモデル名を返します。
 * @returns {string} アクティブなモデル名
 */
const getActiveModel = (): string => {
    if (!pluginSettings) {
        // デフォルトのフォールバック
        return 'gemini-2.5-flash';
    }
    if (pluginSettings.geminiModel === 'custom' && pluginSettings.customGeminiModel) {
        return pluginSettings.customGeminiModel;
    }
    return pluginSettings.geminiModel;
};

export const testConnection = async (apiKey: string, model: string): Promise<{ success: boolean; error?: string }> => {
    if (!apiKey || apiKey.trim() === "") {
        apiKey = process.env.GEMINI_API_KEY || '';
    }
    if (!apiKey || apiKey.trim() === "") {
        return { success: false, error: "APIキーが入力されていません。" };
    }

    try {
        const testAI = new GoogleGenAI({ apiKey: apiKey });
        await testAI.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text: "test" }] }],
        });
        return { success: true };
    } catch (error: any) {
        console.error("Gemini connection test failed:", error);
        return { success: false, error: error.message || "不明なエラーが発生しました。" };
    }
};

// --- Function Calling Tools ---

const getWordList = async (): Promise<{ words: string[] }> => {
    if (!dictionaryProvider) return { words: [] };
    const words = await dictionaryProvider.getWordList();
    console.log("取得した単語リスト:", words);
    return { words };
};
const getWordListDeclaration: FunctionDeclaration = {
    name: "getWordList",
    description: "辞典に登録されているすべての単語の一覧を取得します。",
    parameters: {
        type: Type.OBJECT,
        properties: {},
    }
};

const getWordDetail = async (word: string): Promise<string> => {
    if (!dictionaryProvider) return "Providerが初期化されていません。";
    const content = await dictionaryProvider.getWordDetail(word);
    if (content !== null) {
        console.log(`単語「${word}」の内容を取得しました。`);
        return content;
    }
    console.warn(`単語「${word}」が見つかりません。`);
    return `単語「${word}」は辞典に見つかりませんでした。`;
};
const getWordDetailDeclaration: FunctionDeclaration = {
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
};

const createWordEntry = async (word: string): Promise<string> => {
    if (!dictionaryProvider) return "Providerが初期化されていません。";
    const result = await dictionaryProvider.createWord(word);
    return result.message;
};
const createWordEntryDeclaration: FunctionDeclaration = {
    name: "createWordEntry",
    description: "新しい単語を辞典に登録します。ファイルが作成されると、内容は自動的に生成されます。",
    parameters: {
        type: Type.OBJECT,
        properties: {
            word: {
                type: Type.STRING,
                description: "登録する新しい単語名"
            }
        },
        required: ["word"]
    }
};

const readOnlyTools: Tool[] = [
    {
        functionDeclarations: [
            getWordListDeclaration,
            getWordDetailDeclaration,
        ]
    }
];

const tools: Tool[] = [
    {
        functionDeclarations: [
            getWordListDeclaration,
            getWordDetailDeclaration,
            createWordEntryDeclaration
        ]
    }
];

const functionHandlers: { [key: string]: (...args: any[]) => Promise<any> } = {
    getWordList: () => getWordList(),
    getWordDetail: ({ word }: { word: string }) => getWordDetail(word),
    createWordEntry: ({ word }: { word: string }) => createWordEntry(word),
};

//関連するコンテキスト
//事前に設定することで単語生成時に参照されます。
let activeContext: string | null = null;

/**
 * 現在のアクティブなコンテキストを設定します。
 * 辞典の現在のファイル内容を取得し、activeContextに設定します。
 * @returns {Promise<void>}
 */
export const setActiveContext = async (): Promise<void> => {
    if (!dictionaryProvider) throw "Providerが初期化されていません。";
    const context = await dictionaryProvider.getActiveFileContent();
    if(context){
        activeContext = context;
    }
};


const getLexicalEntryCore = async (word: string, toJson: boolean, entry: string, ...dependentContents: string[]): Promise<string> => {
    if (!checkApiKey() || !ai || !pluginSettings) throw new Error(API_KEY_ERROR_MESSAGE);
    const useFunctionCalls = !toJson;
    //toJsonではない呼び出しで既存のエントリーを使用する場合は再編纂で大きく変える場合も想定する。
    const isRewrite = entry !== "" && useFunctionCalls;

    try {
        let prompt = `あなたは辞典の編纂者です。`;

        if (pluginSettings.bookTitle) {
            prompt += `\nあなたは辞典「${pluginSettings.bookTitle}」の編纂者として、その辞典に掲載するための「${word}」の項目を執筆します。`;
        } else {
            prompt += `\nこれから、辞典に掲載するための「${word}」の項目を執筆します。`;
        }

        prompt += `\n\n辞典に掲載する文章として、その世界観や設定に完全に没入した視点で記述してください。`;
        prompt += `\n生成する文章には、「この辞典では」「${pluginSettings.bookTitle || '辞典'}の文脈では」といった、辞典自体を客観的に説明するような表現は一切含めないでください。`;
        prompt += `\n\nこの辞典特有の意味を主軸とし、一般的な意味は補足として記述してください。`;

        if (pluginSettings.bookDescription) {
            prompt += `\n 辞典の説明: ${pluginSettings.bookDescription}。`;

            prompt += `\n\nこの辞典の内容は、${pluginSettings.bookTitle}の文脈に基づいています。`;
            prompt += `\n\nこの辞典の内容は、${pluginSettings.bookTitle}の世界観や設定に基づいています。`;
            prompt += `\n\nこの辞典の内容は、${pluginSettings.bookTitle}の物語やテーマに基づいています。`;
            prompt += `\n\nこの辞典が架空の世界観、設定、物語に基づく場合、世界観、設定、物語が広がるような内容で記述してください。`;
        }
        if (pluginSettings.authorName) {
            prompt += `\n 編纂者「${pluginSettings.authorName}」の視点から説明してください。`;
        }
        if (pluginSettings.authorDescription) {
            prompt += `\n 編纂者の説明: ${pluginSettings.authorDescription}。`;
        }
        prompt += `\n\n意味(definitions)だけでは説明が難しい場合は解説(explanation)を記述してください。`;
        prompt += `\n\n意味(definition)よりフレーバーテキスト(flavorText)が適切な場合は、意味ではなくフレーバーテキストを記述してください。`;
        prompt += `\n\n意味(definition)が具体的な物品を指す場合は、物品の説明を記述してください。`;
        prompt += `\n\n意味、解説、フレーバーテキストの項目は冗長になりすぎないように記述してください。`;
        prompt += `\n\n文章は長すぎない程度に留め、適切な改行を挿入してください。`;
        prompt += `\n\n意味、フレーバーテキストの項目は編纂者の視点ではなく、その世界観や設定に没入した視点で記述してください。`;
        prompt += `\n\nこの単語を閲覧した架空の人物によるコメントを2～3件生成してください。`;
        prompt += `\nコメント(comments)では、コメンテーターの個性や立場が反映された、世界観が広がるような内容を記述してください。`;
        prompt += `\n\nコメントは、閲覧者がその単語に対してどのような感想や意見を持つかを反映してください。`;
        prompt += `\n\nコメントは、１行で表示されることを想定してください。`;
        prompt += `\nコメンテーターの名前(name)は、その世界観に合った名前を設定してください。`;
        prompt +=  `\nコメンテーターは[陽気な(alignment)][ぬいぐるみ系VTuber(role)][猫乃わん太(name)]のようにその性格や役割を表す要素を含める名乗りができ、匿名にすることもできます。`;
        prompt += `\n\n使用者(あなた)が追記したプライベートなメモ(memos)を1～2件生成してください。`;
        prompt += `\nメモには、個人的な考察や未確認情報などを記述してください。`;
        prompt += `\n\nルビを振る場合、 |漢字《かんじ》 の形式で記述してください。一般的な単語については、ルビを振らないでください。`;
        prompt += `\n\n現在の単語以外のこの辞典特有の固有単語には、 [固有単語](固有単語.md) の形式でリンクを記述してください。なお、リンク先にはルビを含めないでください。`;
        prompt += `\n\n類義語、対義語、関連語の項目は、主にこの辞典固有の単語を記載してください。`;
        prompt += `\n\n類義語、対義語、関連語の項目のリンク記述は不要です。`;
        if (useFunctionCalls) {
            prompt += `\n\n必要な情報は、辞典に登録されている単語の情報を参照してください。`;
            prompt += `\n\n辞典に登録されていない単語は、辞典の文脈で解釈してください。`;
        }
        if (activeContext) {
            let contextPrompt = `\nユーザーは今、以下のページを見ています。\nこの文脈を踏まえて回答してください。`;
            contextPrompt += `\n\n------\n\n`;
            contextPrompt += activeContext;
            contextPrompt += `\n\n------\n\n`;
            prompt += contextPrompt;
        }
        if (dependentContents && dependentContents.length > 0) {
            prompt += `\n\n以下の内容も参照してください。`;
            for (const content of dependentContents) {
                if(content){
                    prompt += `\n\n------\n\n${content}\n\n------\n\n`;
                }
            }
        }
        if (!toJson) {
            prompt += `\n\n必要な情報は以下のJSON形式の語彙情報を参照してください。`;
            prompt += "\n\n```json\n";
            prompt += LexicalEntry.getJSONSchema();
            prompt += "\n```";
        }

        const history: Content[] = [
            { role: "user", parts: [{ text: prompt }] },
        ];
        if (entry) {
            let entryPrompt = `ユーザーは下記単語のページを見ています。必要に応じて再編纂しつつこの内容をなるべく反映させてください。\n`;
            entryPrompt += `\n\n------\n\n`;
            entryPrompt += entry;
            entryPrompt += `\n\n------\n\n`;
            if (isRewrite) {
                entryPrompt += `\n\nこの内容は更新される必要が生じています。他の情報を参照して、最新の内容に情報を修正、追加、更新してください。`;
            }
            history.push({ role: "user", parts: [{ text: entryPrompt }] });
        }
        if (toJson) {
            let jsonPrompt = `\n\nこの「${word}」の語彙情報をJSON形式に合うように再編纂して返してください。`;
            jsonPrompt += `\n\n足りない情報は辞典の文脈で適宜補完してください。`;
            history.push({ role: "user", parts: [{ text: jsonPrompt }] });
        }
        const config0: GenerateContentConfig = {
            tools: readOnlyTools,
        }
        const config1: GenerateContentConfig = {
            responseMimeType: "application/json",
            responseSchema: LexicalEntry.getJSONSchema()
        }

        const result = await ai.models.generateContent({
            model: getActiveModel(),
            contents: history,
            config: toJson ? config1 : config0
        });
        if (toJson) {
            //JSON自体への変更は上位で行う
            return result.text ?? "{}"; // デフォルト値を空のJSON文字列に設定
        } else {
            //JSON形式を想定しない場合は関数呼び出しを想定
            let responsePart = result.candidates?.[0]?.content?.parts?.[0];
            if (!responsePart) {
                return "AIからの応答がありませんでした。";
            }
            let funcCalls = result.functionCalls;
            console.log("functionCalls:", funcCalls);


            while (funcCalls && funcCalls.length > 0) {
                const fc = funcCalls[0];
                //const { name, args } = fc;
                const name = fc.name;
                const args = fc.args;
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
                    model: getActiveModel(),
                    contents: history,
                    config: {
                        tools: readOnlyTools,
                    }
                });

                responsePart = result2.candidates?.[0]?.content?.parts?.[0];
                if (!responsePart) {
                    return "AIからの応答がありませんでした。";
                }
                funcCalls = result2.functionCalls;
                console.log("functionCalls:", funcCalls);
            }

            return responsePart.text || "AIからの応答がありませんでした。";
        }
    } catch (error) {
        console.error(`単語「${word}」の語彙情報取得中にAIエラーが発生しました:`, error);
        throw error;
    }
};

export const getLexicalEntry = async (word: string, ...dependentContents: string[]): Promise<LexicalEntry> => {
    if (!checkApiKey() || !ai || !pluginSettings) throw new Error(API_KEY_ERROR_MESSAGE);
    if (!dictionaryProvider) throw "Providerが初期化されていません。";

    //既存の単語に対する呼び出しの場合、書き換えになる
    const content = await dictionaryProvider.getWordDetail(word);

    //関数呼び出しを含む暫定的な語彙情報の取得
    const desc = await getLexicalEntryCore(word, false, content || "", ...dependentContents);
    console.log(`取得した語彙情報: ${desc}`);
    const response = await getLexicalEntryCore(word, true, desc);
    const jsonResponse = JSON.parse(response);
    return LexicalEntry.fromJSON(jsonResponse);
};

export const getWordDefinition = async (word: string, ...dependentContents: string[]): Promise<string> => {
    const entry = await getLexicalEntry(word, ...dependentContents);
    return LexicalEntryFormatter.toMarkdown(entry);
};


export const generateChatResponse = async (userInput: string): Promise<string> => {
    if (!checkApiKey() || !ai || !pluginSettings || !dictionaryProvider) throw new Error("AIサービスが正しく初期化されていません。");

    const context = await dictionaryProvider.getActiveFileContent();

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
    basePrompt += "ユーザーの依頼に応じて、`createWordEntry`ツールを使って新しい単語を辞典に登録することもできます。";

    const history: Content[] = [
        { role: "user", parts: [{ text: basePrompt }] },
        { role: "model", parts: [{ text: "はい、編纂者です。どのようなご用件でしょうか？" }] }
    ];

    if (context) {
        //キャッシュ的に使用。これによりチャット内で新規単語作成時に適用
        activeContext = context; //関連するコンテキストを設定

        let contextPrompt = `ユーザーは今、以下のページを見ています。\nこの文脈を踏まえて回答してください。`;
        contextPrompt += `\n\n------\n\n`;
        contextPrompt += context;
        contextPrompt += `\n\n------\n\n`;

        history.push({ role: "user", parts: [{ text: contextPrompt }] });
        history.push({ role: "model", parts: [{ text: "承知いたしました。文脈を考慮して回答します。" }] });
    }

    history.push({ role: "user", parts: [{ text: userInput }] });

    try {
        const result = await ai.models.generateContent({
            model: getActiveModel(),
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

        while (funcCalls && funcCalls.length > 0) {
            const fc = funcCalls[0];
            //const { name, args } = fc;
            const name = fc.name;
            const args = fc.args;
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
                model: getActiveModel(),
                contents: history,
                config: {
                    tools: tools,
                }
            });

            responsePart = result2.candidates?.[0]?.content?.parts?.[0];
            if (!responsePart) {
                return "AIからの応答がありませんでした。";
            }
            funcCalls = result2.functionCalls;
            console.log("functionCalls:", funcCalls);
        }

        return responsePart.text || "AIからの応答がありませんでした。";

    } catch (error) {
        console.error("Error generating chat response from Gemini:", error);
        throw new Error("AIからの応答の生成に失敗しました。");
    }
};

