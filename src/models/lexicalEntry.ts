import { v4 as uuidv4 } from 'uuid';
import { CommentEntry } from './CommentEntry';
import { MemoEntry } from './MemoEntry';

export class LexicalEntryDefinitions {
    definitions: string[];
    constructor(content: string[]) {
        this.definitions = content;
    }
    public static getJSONSchema() {
        return {
            type: "OBJECT",
            properties: {
                definitions: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "語の定義の配列"
                },
            },
            required: ["definitions"]
        };
    }
}
export class LexicalEntryFlavorText {
    flavorText: string;
    constructor(content: string) {
        this.flavorText = content;
    }
    public static getJSONSchema() {
        return {
            type: "OBJECT",
            properties: {
                flavorText: {
                    type: "STRING",
                    description: "フレーバーテキストや補足情報"
                },
            },
            required: ["flavorText"]
        };
    }
}

export class LexicalEntry {
    /**
     * 語彙エントリの一意なID
     */
    id: string;

    /**
     * 見出し語 (例: "食べる", "run")
     */
    lemma: string;

    /**
     * 語の読み方や発音 (例: "たべる")
     */
    reading?: string;

    /**
     * 品詞 (例: "動詞", "名詞")
     */
    partOfSpeech: string;

    /*
     * 単語の定義、または、フレーバーテキスト
     */
    content: LexicalEntryDefinitions | LexicalEntryFlavorText;

    /**
     * 単語の意味だけでは理解しづらい内容に対する解説
     */
    explanation?: string;


    /**
     * 例文
     */
    examples?: { sentence: string; source?: string }[];

    /**
     * 語源
     */
    etymology?: string;

    /**
     * 類義語
     */
    synonyms?: string[];

    /**
     * 対義語
     */
    antonyms?: string[];

    /**
     * 閲覧者によるコメント
     */
    comments?: CommentEntry[];

    /**
     * 使用者によるプライベートなメモ
     */
    memos?: MemoEntry[];

    /**
     * タグやラベル
     */
    tags?: string[];

    constructor(
        id: string,
        lemma: string,
        reading: string,
        partOfSpeech: string,
        content: LexicalEntryDefinitions | LexicalEntryFlavorText,
        options: {
            explanation?: string;
            examples?: { sentence: string; source?: string }[];
            synonyms?: string[];
            antonyms?: string[];
            comments?: CommentEntry[];
            memos?: MemoEntry[];
            tags?: string[];
            etymology?: string;
        } = {}
    ) {
        this.id = id;
        this.lemma = lemma;
        this.reading = reading;
        this.partOfSpeech = partOfSpeech;
        this.content = content;
        this.explanation = options.explanation;
        this.examples = options.examples;
        this.synonyms = options.synonyms;
        this.antonyms = options.antonyms;
        this.comments = options.comments;
        this.memos = options.memos;
        this.tags = options.tags;
        this.etymology = options.etymology;
    }

    public static getJSONSchema() {
        return {
            type: "OBJECT",
            properties: {
                lemma: { type: "STRING", description: "見出し語" },
                reading: { type: "STRING", description: "語の読み方や発音" },
                partOfSpeech: { type: "STRING", description: "品詞" },
                /* oneOfは使用できない
                content: {
                    oneOf: [
                        LexicalEntryDefinitions.getJSONSchema(),
                        LexicalEntryFlavorText.getJSONSchema()
                    ],
                    description: "単語の定義、または、フレーバーテキスト"
                },
                */  
                definitions:{
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "語の定義の配列 / flavorTextと排他"
                },
                flavorText: { type: "STRING", description: "フレーバーテキストや補足情報 / definitionsと排他" },
                explanation: { type: "STRING", description: "単語の意味だけでは理解しづらい内容に対する解説" },
                examples: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            sentence: { type: "STRING" },
                            source: { type: "STRING" }
                        },
                        required: ["sentence"]
                    },
                    description: "例文"
                },
                synonyms: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "類義語"
                },
                antonyms: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "対義語"
                },
                etymology: { type: "STRING", description: "語源" },
                comments: {
                    type: "ARRAY",
                    items: CommentEntry.getJSONSchema(),
                    description: "閲覧者によるコメントの配列"
                },
                memos: {
                    type: "ARRAY",
                    items: MemoEntry.getJSONSchema(),
                    description: "使用者によるプライベートなメモの配列"
                },
                tags: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "タグやラベル"
                }
            },
            required: ["lemma", "reading", "partOfSpeech", "definitions","flavorText"]
        };
    }

    public static fromJSON(json: any): LexicalEntry {
        console.log("LexicalEntry.fromJSON");
        console.log(json);

        return new LexicalEntry(
            uuidv4(),
            json.lemma,
            json.reading,
            json.partOfSpeech,
            (json.definitions && json.definitions.length > 0 ) ? new LexicalEntryDefinitions(json.definitions) : new LexicalEntryFlavorText(json.flavorText),
            {
                explanation: json.explanation,
                examples: json.examples,
                synonyms: json.synonyms,
                antonyms: json.antonyms,
                comments: json.comments ? json.comments.map((c: any) => CommentEntry.fromJSON(c)) : undefined,
                memos: json.memos ? json.memos.map((m: any) => MemoEntry.fromJSON(m)) : undefined,
                tags: json.tags,
                etymology: json.etymology,
            }
        );
    }
}