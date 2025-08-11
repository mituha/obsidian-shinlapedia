
import { v4 as uuidv4 } from 'uuid';
import { CommentEntry } from './CommentEntry';

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

    /**
     * 語の定義の配列
     */
    definitions: string[];

    /**
     * 単語の意味だけでは理解しづらい内容に対する解説
     */
    explanation?: string;

    /**
     * フレーバーテキストや補足情報
     */
    flavorText?: string;

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
     * タグやラベル
     */
    tags?: string[];

    /**
     * 作成日時
     */
    createdAt: Date;

    /**
     * 最終更新日時
     */
    updatedAt: Date;

    constructor(
        id: string,
        lemma: string,
        partOfSpeech: string,
        definitions: string[],
        options: {
            reading?: string;
            explanation?: string;
            flavorText?: string;
            examples?: { sentence: string; source?: string }[];
            synonyms?: string[];
            antonyms?: string[];
            comments?: CommentEntry[];
            tags?: string[];
            etymology?: string;
            createdAt?: Date;
            updatedAt?: Date;
        } = {}
    ) {
        this.id = id;
        this.lemma = lemma;
        this.partOfSpeech = partOfSpeech;
        this.definitions = definitions;
        this.reading = options.reading;
        this.explanation = options.explanation;
        this.flavorText = options.flavorText;
        this.examples = options.examples;
        this.synonyms = options.synonyms;
        this.antonyms = options.antonyms;
        this.comments = options.comments;
        this.tags = options.tags;
        this.etymology = options.etymology;
        this.createdAt = options.createdAt || new Date();
        this.updatedAt = options.updatedAt || new Date();
    }

    public static getJSONSchema() {
        const commentJSONSchema = CommentEntry.getJSONSchema();
        return {
            type: "OBJECT",
            properties: {
                lemma: { type: "STRING", description: "見出し語" },
                reading: { type: "STRING", description: "語の読み方や発音" },
                partOfSpeech: { type: "STRING", description: "品詞" },
                definitions: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "語の定義の配列"
                },
                explanation: { type: "STRING", description: "単語の意味だけでは理解しづらい内容に対する解説" },
                flavorText: { type: "STRING", description: "フレーバーテキストや補足情報" },
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
                    items: commentJSONSchema,
                    description: "閲覧者によるコメントの配列"
                },
                tags: {
                    type: "ARRAY",
                    items: { type: "STRING" },
                    description: "タグやラベル"
                }
            },
            required: ["lemma", "partOfSpeech", "definitions"]
        };
    }

    public static fromJSON(json: any): LexicalEntry {
        return new LexicalEntry(
            uuidv4(),
            json.lemma,
            json.partOfSpeech,
            json.definitions,
            {
                reading: json.reading,
                explanation: json.explanation,
                flavorText: json.flavorText,
                examples: json.examples,
                synonyms: json.synonyms,
                antonyms: json.antonyms,
                comments: json.comments ? json.comments.map((c: any) => CommentEntry.fromJSON(c)) : undefined,
                tags: json.tags,
                etymology: json.etymology,
            }
        );
    }
}
